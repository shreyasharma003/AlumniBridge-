package com.alumnibridge.controller;

import com.alumnibridge.entity.Batch;
import com.alumnibridge.entity.User;
import com.alumnibridge.repository.BatchRepository;
import com.alumnibridge.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class BatchController {

    private final BatchRepository batchRepository;
    private final UserRepository userRepository;

    public BatchController(BatchRepository batchRepository, UserRepository userRepository) {
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/batches")
    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }
    
    @GetMapping("/batches/{id}")
    public ResponseEntity<Map<String, Object>> getBatchWithUsers(@PathVariable Long id) {
        Batch batch = batchRepository.findById(id).orElse(null);
        if (batch == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<User> users = userRepository.findAll().stream()
            .filter(user -> user.getProfile() != null && 
                           user.getProfile().getBatch() != null && 
                           user.getProfile().getBatch().getId().equals(id))
            .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", batch.getId());
        response.put("year", batch.getYear());
        response.put("users", users);
        
        return ResponseEntity.ok(response);
    }
}
