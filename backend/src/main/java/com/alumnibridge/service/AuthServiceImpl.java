package com.alumnibridge.service;

import com.alumnibridge.dto.*;
import com.alumnibridge.entity.*;
import com.alumnibridge.exception.ResourceNotFoundException;
import com.alumnibridge.repository.*;
import com.alumnibridge.security.JwtTokenProvider;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    // If you have BatchRepository / DegreeRepository, inject them (optional)
    private final BatchRepository batchRepository;
    private final DegreeRepository degreeRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Update constructor to receive repositories (Spring will inject)
    public AuthServiceImpl(UserRepository ur,
                           ProfileRepository pr,
                           BatchRepository br,        // if available; else pass null
                           DegreeRepository dr,       // if available; else pass null
                           AuthenticationManager am,
                           JwtTokenProvider jtp) {
        this.userRepository = ur;
        this.profileRepository = pr;
        this.batchRepository = br;
        this.degreeRepository = dr;
        this.authenticationManager = am;
        this.tokenProvider = jtp;
    }

    @Override
    public AuthResponse register(RegisterDto dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User u = new User();
        u.setEmail(dto.getEmail());
        u.setName(dto.getName());
        u.setPassword(passwordEncoder.encode(dto.getPassword()));
        u.setRole(User.Role.valueOf(dto.getRole().toUpperCase()));

        // profile
        Profile p = new Profile();
        p.setUser(u);
        p.setBio(dto.getBio());
        p.setLinkedinUrl(dto.getLinkedinUrl());
        p.setInstitute(dto.getInstitute());

        // IMPORTANT: set batchYear and degreeName from dto
        if (dto.getBatchYear() != null) {
            p.setBatchYear(dto.getBatchYear());
        }
        if (dto.getDegreeName() != null && !dto.getDegreeName().isBlank()) {
            // Try to find degree by name
            if (degreeRepository != null) {
                var degree = degreeRepository.findFirstByName(dto.getDegreeName()).orElse(null);
                p.setDegree(degree);
            }
            // Also store the name for reference
            p.setDegreeName(dto.getDegreeName());
        }

        // attach profile to user
        u.setProfile(p);

        // save user (will cascade profile if cascade configured)
        userRepository.save(u);

        // create token
        org.springframework.security.core.userdetails.UserDetails ud =
                new org.springframework.security.core.userdetails.User(u.getEmail(), u.getPassword(),
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
        String token = tokenProvider.generateToken(ud);
        return new AuthResponse(token, u.getId(), u.getRole().name());
    }

    @Override
    public AuthResponse login(String email, String password) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User u = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        org.springframework.security.core.userdetails.UserDetails ud =
                new org.springframework.security.core.userdetails.User(u.getEmail(), u.getPassword(),
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
        String token = tokenProvider.generateToken(ud);
        return new AuthResponse(token, u.getId(), u.getRole().name());
    }
}
