package com.alumnibridge.service;

import com.alumnibridge.dto.UserDto;

import java.util.List;
import java.util.Map;

public interface UserService {

    // Fetch logged-in user profile
    UserDto getProfileByEmail(String email);

    // Needed for authentication-based access control
    Long getUserIdByEmail(String email);

    // Fetch profile by ID
    UserDto getProfile(Long id);

    // Update profile
    UserDto updateProfile(Long id, UserDto dto);

    // Search users
    List<UserDto> searchUsers(String q, String degree, String institute, Integer batchYear, String role);

    // Connection requests
    void sendConnectionRequest(Long senderId, Long receiverId);

    void respondConnectionRequest(Long requestId, boolean accept);

    // Get pending connection requests for a user
    List<?> getPendingRequests(Long userId);

    // Get sent connection requests
    List<?> getSentRequests(Long userId);

    // Get active connections for a user
    List<UserDto> getActiveConnections(Long userId);

    // Disconnect two users
    void disconnectUsers(Long userId1, Long userId2);

    // Get connection status between two users
    Map<String, Object> getConnectionStatus(Long userId, Long otherUserId);
}
