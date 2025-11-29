package com.alumnibridge.service;

import com.alumnibridge.dto.UserDto;
import com.alumnibridge.dto.ConnectionRequestDto;
import com.alumnibridge.entity.*;
import com.alumnibridge.exception.ResourceNotFoundException;
import com.alumnibridge.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ConnectionRequestRepository connectionRepository;
    private final BatchRepository batchRepository;
    private final DegreeRepository degreeRepository;
    private final ProfileRepository profileRepository;

    public UserServiceImpl(UserRepository ur,
                           ConnectionRequestRepository cr,
                           BatchRepository br,
                           DegreeRepository dr,
                           ProfileRepository pr) {
        this.userRepository = ur;
        this.connectionRepository = cr;
        this.batchRepository = br;
        this.degreeRepository = dr;
        this.profileRepository = pr;
    }

    // ============================
    // FETCH USER BY EMAIL (for /me)
    // ============================
    @Override
    public UserDto getProfileByEmail(String email) {
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return toDto(u);
    }

    // ============================
    // GET USER ID BY EMAIL (for JWT)
    // ============================
    @Override
    public Long getUserIdByEmail(String email) {
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return u.getId();
    }

    // ============================
    // GET PROFILE BY ID
    // ============================
    @Override
    public UserDto getProfile(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return toDto(u);
    }

    // ============================
    // UPDATE PROFILE
    // ============================
    @Override
    public UserDto updateProfile(Long id, UserDto dto) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        u.setName(dto.getName());

        Profile p = u.getProfile();
        if (p == null) {
            p = new Profile();
            p.setUser(u);
            u.setProfile(p);
        }

        p.setBio(dto.getBio());
        p.setHeadline(dto.getHeadline());
        p.setSkills(dto.getSkills());
        p.setLocation(dto.getLocation());
        p.setLinkedinUrl(dto.getLinkedinUrl());
        p.setGithubUrl(dto.getGithubUrl());
        p.setPortfolioUrl(dto.getPortfolioUrl());
        p.setPictureUrl(dto.getPictureUrl());
        p.setInstitute(dto.getInstitute());

        if (dto.getBatchYear() != null) {
            Batch b = batchRepository.findByYear(dto.getBatchYear())
                    .orElseGet(() -> {
                        Batch newBatch = new Batch();
                        newBatch.setYear(dto.getBatchYear());
                        return batchRepository.save(newBatch);
                    });
            p.setBatch(b);
        }

        if (dto.getDegreeName() != null && !dto.getDegreeName().isBlank()) {
            Degree d = degreeRepository.findFirstByName(dto.getDegreeName())
                    .orElseGet(() -> degreeRepository.save(new Degree(null, dto.getDegreeName())));
            p.setDegree(d);
            p.setDegreeName(d.getName());
        }

        userRepository.save(u);

        return toDto(u);
    }

    // ============================
    // SEARCH USERS
    // ============================
    @Override
    public List<UserDto> searchUsers(String q, String degree, String institute, Integer batchYear, String role) {

        List<User> users;

        if (q != null && !q.isBlank()) {
            users = userRepository.findByNameContainingIgnoreCase(q);
        } else {
            users = userRepository.findAll();
        }

        return users.stream().filter(u -> {
            // Filter by role if provided
            if (role != null && !role.isBlank()) {
                String[] roles = role.split(",");
                boolean matchesRole = false;
                for (String r : roles) {
                    if (u.getRole().toString().equalsIgnoreCase(r.trim())) {
                        matchesRole = true;
                        break;
                    }
                }
                if (!matchesRole) return false;
            }

            Profile p = u.getProfile();

            if (degree != null && !degree.isBlank()) {
                if (p == null || p.getDegree() == null ||
                        !degree.equalsIgnoreCase(p.getDegree().getName()))
                    return false;
            }

            if (institute != null && !institute.isBlank()) {
                if (p == null || p.getInstitute() == null ||
                        !p.getInstitute().equalsIgnoreCase(institute))
                    return false;
            }

            if (batchYear != null) {
                if (p == null || p.getBatch() == null ||
                        !batchYear.equals(p.getBatch().getYear()))
                    return false;
            }

            return true;
        }).map(this::toDto).collect(Collectors.toList());
    }

    // ============================
    // SEND CONNECTION REQUEST
    // ============================
    @Override
    public void sendConnectionRequest(Long senderId, Long receiverId) {

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You cannot send a connection request to yourself");
        }

        connectionRepository.findConnectionBetweenUsers(sender, receiver)
                .ifPresent(existing -> {
                    switch (existing.getStatus()) {
                        case PENDING:
                            if (existing.getSender().equals(sender)) {
                                throw new IllegalArgumentException("Connection request already sent");
                            } else {
                                throw new IllegalArgumentException("You already have a pending request from this user");
                            }
                        case ACCEPTED:
                            throw new IllegalArgumentException("You are already connected with this user");
                        case REJECTED:
                            connectionRepository.delete(existing);
                            break;
                        default:
                            connectionRepository.delete(existing);
                    }
                });

        ConnectionRequest cr = new ConnectionRequest();
        cr.setSender(sender);
        cr.setReceiver(receiver);
        cr.setStatus(ConnectionRequest.Status.PENDING);

        connectionRepository.save(cr);
    }

    // ============================
    // RESPOND CONNECTION REQUEST
    // ============================
    @Override
    public void respondConnectionRequest(Long requestId, boolean accept) {
        ConnectionRequest cr = connectionRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        cr.setStatus(accept ? ConnectionRequest.Status.ACCEPTED :
                ConnectionRequest.Status.REJECTED);

        connectionRepository.save(cr);
    }

    // ============================
    // GET PENDING REQUESTS
    // ============================
    @Override
    public List<?> getPendingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return connectionRepository.findByReceiverAndStatus(user, ConnectionRequest.Status.PENDING)
                .stream()
                .map(cr -> {
                    ConnectionRequestDto dto = new ConnectionRequestDto();
                    dto.setId(cr.getId());
                    dto.setSender(toDto(cr.getSender()));
                    dto.setReceiver(toDto(cr.getReceiver()));
                    dto.setStatus(cr.getStatus().toString());
                    dto.setCreatedAt(cr.getCreatedAt() != null ? cr.getCreatedAt().toString() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ============================
    // GET ACTIVE CONNECTIONS
    // ============================
    @Override
    public List<UserDto> getActiveConnections(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get connections where user sent and was accepted
        List<ConnectionRequest> sentAccepted = connectionRepository.findBySender(user).stream()
                .filter(cr -> cr.getStatus() == ConnectionRequest.Status.ACCEPTED)
                .collect(Collectors.toList());

        // Get connections where user received and was accepted
        List<ConnectionRequest> receivedAccepted = connectionRepository.findByReceiverAndStatus(user, ConnectionRequest.Status.ACCEPTED);

        Set<Long> connectedUserIds = new HashSet<>();
        sentAccepted.forEach(cr -> connectedUserIds.add(cr.getReceiver().getId()));
        receivedAccepted.forEach(cr -> connectedUserIds.add(cr.getSender().getId()));

        return connectedUserIds.stream()
                .map(connectedUserId -> toDto(userRepository.findById(connectedUserId).orElse(null)))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // ============================
    // DISCONNECT USERS
    // ============================
    @Override
    public void disconnectUsers(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new ResourceNotFoundException("Other user not found"));

        // Delete connection in either direction
        connectionRepository.findBySenderAndReceiver(user1, user2).ifPresent(connectionRepository::delete);
        connectionRepository.findBySenderAndReceiver(user2, user1).ifPresent(connectionRepository::delete);
    }

    // ============================
    // GET CONNECTION STATUS
    // ============================
    @Override
    public Map<String, Object> getConnectionStatus(Long userId, Long otherUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Other user not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("otherUserId", otherUserId);

        Optional<ConnectionRequest> connection = connectionRepository.findConnectionBetweenUsers(user, otherUser);

        if (connection.isEmpty()) {
            result.put("status", "NONE");
            result.put("canConnect", true);
            result.put("requestId", null);
        } else {
            ConnectionRequest cr = connection.get();
            result.put("status", cr.getStatus().toString());
            result.put("requestId", cr.getId());
            
            // Check if current user sent or received the request
            boolean isSender = cr.getSender().getId().equals(userId);
            result.put("isSender", isSender);
            
            if (cr.getStatus() == ConnectionRequest.Status.PENDING) {
                result.put("canConnect", false);
                result.put("canAccept", !isSender); // Only receiver can accept
                result.put("canCancel", isSender);  // Only sender can cancel
            } else if (cr.getStatus() == ConnectionRequest.Status.ACCEPTED) {
                result.put("canConnect", false);
                result.put("isConnected", true);
            } else {
                result.put("canConnect", true); // Rejected, can try again
            }
        }

        return result;
    }

    // ============================
    // GET SENT REQUESTS
    // ============================
    @Override
    public List<?> getSentRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return connectionRepository.findBySender(user)
                .stream()
                .filter(cr -> cr.getStatus() == ConnectionRequest.Status.PENDING)
                .map(cr -> {
                    ConnectionRequestDto dto = new ConnectionRequestDto();
                    dto.setId(cr.getId());
                    dto.setSender(toDto(cr.getSender()));
                    dto.setReceiver(toDto(cr.getReceiver()));
                    dto.setStatus(cr.getStatus().toString());
                    dto.setCreatedAt(cr.getCreatedAt() != null ? cr.getCreatedAt().toString() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ============================
    // HELPER: Convert Entity → DTO
    // ============================
    private UserDto toDto(User u) {
        if (u == null) {
            return null;
        }

        UserDto d = new UserDto();

        d.setId(u.getId());
        d.setName(u.getName());
        d.setEmail(u.getEmail());
        d.setRole(u.getRole().name());

        if (u.getProfile() != null) {
            Profile p = u.getProfile();
            d.setBio(p.getBio());
            d.setHeadline(p.getHeadline());
            d.setSkills(p.getSkills());
            d.setLocation(p.getLocation());
            d.setLinkedinUrl(p.getLinkedinUrl());
            d.setGithubUrl(p.getGithubUrl());
            d.setPortfolioUrl(p.getPortfolioUrl());
            d.setPictureUrl(p.getPictureUrl());
            d.setInstitute(p.getInstitute());

            if (p.getBatch() != null) d.setBatchYear(p.getBatch().getYear());
            if (p.getDegree() != null) d.setDegreeName(p.getDegree().getName());
        }

        return d;
    }
}
