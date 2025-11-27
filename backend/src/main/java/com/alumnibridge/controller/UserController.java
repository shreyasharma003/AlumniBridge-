package com.alumnibridge.controller;

import com.alumnibridge.dto.UserDto;
import com.alumnibridge.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService s) {
        this.userService = s;
    }

    // ============================
    // GET LOGGED-IN USER DETAILS
    // ============================
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return ResponseEntity.ok(
                userService.getProfileByEmail(userDetails.getUsername())
        );
    }

    // ============================
    // GET USER PROFILE BY ID
    // ============================
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    // ============================
    // UPDATE LOGGED-IN USER PROFILE
    // ============================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails userDetails,
                                           @RequestBody UserDto dto) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long loggedInUserId = userService.getUserIdByEmail(userDetails.getUsername());

        // Prevent updating another user's data
        if (!loggedInUserId.equals(id)) {
            return ResponseEntity.status(403).body("Forbidden: Cannot update other user profile");
        }

        return ResponseEntity.ok(userService.updateProfile(id, dto));
    }

    // ============================
    // SEARCH USERS BY FILTERS
    // ============================
    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String institute,
            @RequestParam(required = false) Integer batchYear) {

        return ResponseEntity.ok(
                userService.searchUsers(q, degree, institute, batchYear)
        );
    }

    // ============================
    // SEND CONNECTION REQUEST
    // Sender extracted from JWT
    // ============================
    @PostMapping("/connect/{receiverId}")
    public ResponseEntity<?> sendConnection(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long receiverId) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long senderId = userService.getUserIdByEmail(userDetails.getUsername());
        userService.sendConnectionRequest(senderId, receiverId);

        return ResponseEntity.ok("Connection request sent");
    }

    // ============================
    // ACCEPT / REJECT CONNECTION REQUEST
    // ============================
    @PostMapping("/connection/{requestId}/respond")
    public ResponseEntity<?> respondConnection(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long requestId,
            @RequestParam boolean accept) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        userService.respondConnectionRequest(requestId, accept);
        return ResponseEntity.ok(accept ? "Connection Accepted" : "Connection Rejected");
    }

    // ============================
    // GET PENDING CONNECTION REQUESTS
    // ============================
    @GetMapping("/connection-requests")
    public ResponseEntity<?> getPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userService.getUserIdByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getPendingRequests(userId));
    }

    // ============================
    // GET ACTIVE CONNECTIONS
    // ============================
    @GetMapping("/connections")
    public ResponseEntity<?> getConnections(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userService.getUserIdByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getActiveConnections(userId));
    }

    // ============================
    // DISCONNECT / REMOVE CONNECTION
    // ============================
    @PostMapping("/disconnect/{userId}")
    public ResponseEntity<?> disconnect(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long currentUserId = userService.getUserIdByEmail(userDetails.getUsername());
        userService.disconnectUsers(currentUserId, userId);
        return ResponseEntity.ok("Connection removed");
    }

    // ============================
    // GET CONNECTION STATUS WITH USER
    // ============================
    @GetMapping("/connection-status/{otherUserId}")
    public ResponseEntity<?> getConnectionStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long otherUserId) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long currentUserId = userService.getUserIdByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getConnectionStatus(currentUserId, otherUserId));
    }

    // ============================
    // GET SENT CONNECTION REQUESTS
    // ============================
    @GetMapping("/sent-requests")
    public ResponseEntity<?> getSentRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = userService.getUserIdByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getSentRequests(userId));
    }
}
