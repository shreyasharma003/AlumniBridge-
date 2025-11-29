package com.alumnibridge.controller;

import com.alumnibridge.entity.User;
import com.alumnibridge.repository.EventRegistrationRepository;
import com.alumnibridge.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository userRepository;
    private final EventRegistrationRepository regRepository;

    public AdminController(UserRepository ur, EventRegistrationRepository er) {
        this.userRepository = ur;
        this.regRepository = er;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        long total = userRepository.count();
        long students = userRepository.findByRole(User.Role.STUDENT).size();
        long alumni = userRepository.findByRole(User.Role.ALUMNI).size();
        return ResponseEntity.ok(
                java.util.Map.of("total", total, "students", students, "alumni", alumni)
        );
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> allUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
            .map(user -> Map.<String, Object>of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole().name(),
                "enabled", user.isEnabled(),
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "",
                "isOnline", user.isOnline()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/event-registrations")
    public ResponseEntity<?> eventRegs() {
        // can be improved
        return ResponseEntity.ok(regRepository.findAll());
    }
}
