package com.alumnibridge.controller;

import com.alumnibridge.entity.User;
import com.alumnibridge.repository.EventRegistrationRepository;
import com.alumnibridge.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<User>> allUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/event-registrations")
    public ResponseEntity<?> eventRegs() {
        // can be improved
        return ResponseEntity.ok(regRepository.findAll());
    }
}
