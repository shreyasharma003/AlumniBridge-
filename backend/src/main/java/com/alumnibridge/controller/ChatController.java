package com.alumnibridge.controller;

import com.alumnibridge.entity.Message;
import com.alumnibridge.entity.User;
import com.alumnibridge.entity.ConnectionRequest;
import com.alumnibridge.repository.MessageRepository;
import com.alumnibridge.repository.UserRepository;
import com.alumnibridge.repository.ConnectionRequestRepository;
import com.alumnibridge.security.AppUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RestController
@RequestMapping("/api")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ConnectionRequestRepository connectionRepository;

    public ChatController(SimpMessagingTemplate t, UserRepository ur, MessageRepository mr, ConnectionRequestRepository cr) {
        this.messagingTemplate = t;
        this.userRepository = ur;
        this.messageRepository = mr;
        this.connectionRepository = cr;
    }

    // Update user's last active time (heartbeat)
    @PostMapping("/users/heartbeat")
    public ResponseEntity<?> heartbeat(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        
        AppUserDetails userDetails = (AppUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("status", "ok", "timestamp", LocalDateTime.now()));
    }

    // Get user's online status
    @GetMapping("/users/{userId}/status")
    public ResponseEntity<?> getUserStatus(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        Map<String, Object> status = new HashMap<>();
        status.put("userId", userId);
        status.put("isOnline", user.isOnline());
        status.put("lastActiveAt", user.getLastActiveAt());
        
        return ResponseEntity.ok(status);
    }

    // Get online status for multiple users
    @PostMapping("/users/status/bulk")
    public ResponseEntity<?> getBulkUserStatus(@RequestBody List<Long> userIds) {
        List<Map<String, Object>> statuses = userIds.stream()
            .map(userId -> {
                Map<String, Object> status = new HashMap<>();
                status.put("userId", userId);
                userRepository.findById(userId).ifPresentOrElse(
                    user -> {
                        status.put("isOnline", user.isOnline());
                        status.put("lastActiveAt", user.getLastActiveAt());
                    },
                    () -> {
                        status.put("isOnline", false);
                        status.put("lastActiveAt", null);
                    }
                );
                return status;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(statuses);
    }

    // Get connected users for chat (only show connections)
    @GetMapping("/chat/connections")
    public ResponseEntity<?> getChatConnections(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        
        AppUserDetails userDetails = (AppUserDetails) authentication.getPrincipal();
        Long currentUserId = userDetails.getUser().getId();
        User currentUser = userDetails.getUser();
        
        // Get all accepted connections
        List<User> connectedUsers = new ArrayList<>();
        
        // Connections where current user sent request
        connectionRepository.findBySender(currentUser).stream()
            .filter(cr -> cr.getStatus() == ConnectionRequest.Status.ACCEPTED)
            .forEach(cr -> connectedUsers.add(cr.getReceiver()));
        
        // Connections where current user received request
        connectionRepository.findByReceiver(currentUser).stream()
            .filter(cr -> cr.getStatus() == ConnectionRequest.Status.ACCEPTED)
            .forEach(cr -> connectedUsers.add(cr.getSender()));
        
        // Build response with online status
        List<Map<String, Object>> response = connectedUsers.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole().name());
                userMap.put("isOnline", user.isOnline());
                userMap.put("lastActiveAt", user.getLastActiveAt());
                
                if (user.getProfile() != null) {
                    userMap.put("headline", user.getProfile().getHeadline());
                    userMap.put("pictureUrl", user.getProfile().getPictureUrl());
                }
                
                // Get last message with this user
                List<Message> messages = messageRepository.findConversation(currentUserId, user.getId());
                if (!messages.isEmpty()) {
                    Message lastMsg = messages.get(messages.size() - 1);
                    userMap.put("lastMessage", lastMsg.getContent());
                    userMap.put("lastMessageAt", lastMsg.getSentAt());
                }
                
                return userMap;
            })
            .sorted((a, b) -> {
                // Sort by last message time, then by online status
                LocalDateTime timeA = (LocalDateTime) a.get("lastMessageAt");
                LocalDateTime timeB = (LocalDateTime) b.get("lastMessageAt");
                if (timeA != null && timeB != null) {
                    return timeB.compareTo(timeA);
                }
                if (timeA != null) return -1;
                if (timeB != null) return 1;
                
                boolean onlineA = (boolean) a.get("isOnline");
                boolean onlineB = (boolean) b.get("isOnline");
                return Boolean.compare(onlineB, onlineA);
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    // REST API endpoints for HTTP chat
    @GetMapping("/messages")
    public ResponseEntity<List<Map<String, Object>>> getConversations(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        AppUserDetails userDetails = (AppUserDetails) authentication.getPrincipal();
        Long currentUserId = userDetails.getUser().getId();
        
        // Update last active
        User currentUser = userDetails.getUser();
        currentUser.setLastActiveAt(LocalDateTime.now());
        userRepository.save(currentUser);

        List<Message> messages = messageRepository.findBySenderIdOrRecipientId(currentUserId);
        
        Map<Long, Map<String, Object>> conversationMap = new LinkedHashMap<>();
        
        for (Message msg : messages) {
            Long otherUserId = msg.getSender().getId().equals(currentUserId) ? 
                msg.getReceiver().getId() : msg.getSender().getId();
            User otherUser = msg.getSender().getId().equals(currentUserId) ? 
                msg.getReceiver() : msg.getSender();
            
            if (!conversationMap.containsKey(otherUserId)) {
                Map<String, Object> conversation = new HashMap<>();
                conversation.put("userId", otherUserId);
                conversation.put("userName", otherUser.getName());
                conversation.put("lastMessage", msg.getContent());
                conversation.put("lastMessageAt", msg.getSentAt());
                conversation.put("isOnline", otherUser.isOnline());
                conversation.put("lastActiveAt", otherUser.getLastActiveAt());
                conversationMap.put(otherUserId, conversation);
            }
        }
        
        return ResponseEntity.ok(new ArrayList<>(conversationMap.values()));
    }

    @GetMapping("/messages/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getMessages(
            @PathVariable Long userId,
            Authentication authentication) {
        
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        AppUserDetails userDetails = (AppUserDetails) authentication.getPrincipal();
        Long currentUserId = userDetails.getUser().getId();
        
        // Update last active
        User currentUser = userDetails.getUser();
        currentUser.setLastActiveAt(LocalDateTime.now());
        userRepository.save(currentUser);

        List<Message> messages = messageRepository.findConversation(currentUserId, userId);
        
        List<Map<String, Object>> response = messages.stream()
            .map(msg -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", msg.getId());
                map.put("senderId", msg.getSender().getId());
                map.put("senderName", msg.getSender().getName());
                map.put("recipientId", msg.getReceiver().getId());
                map.put("recipientName", msg.getReceiver().getName());
                map.put("content", msg.getContent());
                map.put("timestamp", msg.getSentAt());
                return map;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        AppUserDetails userDetails = (AppUserDetails) authentication.getPrincipal();
        Long senderId = userDetails.getUser().getId();
        
        // Update last active
        User sender = userDetails.getUser();
        sender.setLastActiveAt(LocalDateTime.now());
        userRepository.save(sender);

        Long recipientId = ((Number) request.get("recipientId")).longValue();
        String content = (String) request.get("content");

        Optional<User> senderOpt = userRepository.findById(senderId);
        Optional<User> recipientOpt = userRepository.findById(recipientId);

        if (senderOpt.isEmpty() || recipientOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid user"));
        }

        Message message = new Message();
        message.setSender(senderOpt.get());
        message.setReceiver(recipientOpt.get());
        message.setContent(content);
        message.setSentAt(LocalDateTime.now());

        Message saved = messageRepository.save(message);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("senderId", saved.getSender().getId());
        response.put("senderName", saved.getSender().getName());
        response.put("recipientId", saved.getReceiver().getId());
        response.put("recipientName", saved.getReceiver().getName());
        response.put("content", saved.getContent());
        response.put("timestamp", saved.getSentAt());

        return ResponseEntity.ok(response);
    }

    // WebSocket endpoint for real-time chat
    // payload: {senderId, receiverId, content, isEventLink, eventId}
    @MessageMapping("/chat.send")
    public void sendWebSocketMessage(ChatMessagePayload payload) {
        User sender = userRepository.findById(payload.getSenderId()).orElse(null);
        User receiver = userRepository.findById(payload.getReceiverId()).orElse(null);
        if (sender == null || receiver == null) return;
        Message m = new Message();
        m.setSender(sender);
        m.setReceiver(receiver);
        m.setContent(payload.getContent());
        m.setEventLink(payload.isEventLink());
        m.setEventId(payload.getEventId());
        messageRepository.save(m);
        // send to receiver queue
        messagingTemplate.convertAndSend("/queue/messages/" + payload.getReceiverId(), payload);
    }

    public static class ChatMessagePayload {
        private Long senderId;
        private Long receiverId;
        private String content;
        private boolean isEventLink;
        private Long eventId;
        // getters/setters
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long s) { this.senderId = s; }
        public Long getReceiverId() { return receiverId; }
        public void setReceiverId(Long r) { this.receiverId = r; }
        public String getContent() { return content; }
        public void setContent(String c) { this.content = c; }
        public boolean isEventLink() { return isEventLink; }
        public void setEventLink(boolean b) { this.isEventLink = b; }
        public Long getEventId() { return eventId; }
        public void setEventId(Long e) { this.eventId = e; }
    }
}
