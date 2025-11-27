package com.alumnibridge.controller;

import com.alumnibridge.dto.EventDto;
import com.alumnibridge.security.AppUserDetails;
import com.alumnibridge.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    private final EventService eventService;
    
    public EventController(EventService es) { 
        this.eventService = es; 
    }

    @PostMapping("/")
    public ResponseEntity<?> createEvent(@RequestBody EventDto dto, Authentication auth) {
        logger.info("📝 CREATE EVENT REQUEST");
        logger.info("  Title: {}", dto.getTitle());
        logger.info("  Date: {}", dto.getEventDate());
        logger.info("  Time: {}", dto.getEventTime());
        logger.info("  Auth present: {}", auth != null);
        logger.info("  Auth type: {}", auth != null ? auth.getPrincipal().getClass().getSimpleName() : "null");
        
        Long creatorId = null;
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails) {
            creatorId = ((AppUserDetails) auth.getPrincipal()).getUser().getId();
            logger.info("  Creator ID: {}", creatorId);
        }
        if (creatorId == null) {
            logger.error("❌ User not authenticated");
            return ResponseEntity.badRequest().body("User not authenticated");
        }
        
        try {
            EventDto res = eventService.createEvent(dto, creatorId);
            logger.info("✅ Event created with ID: {}", res.getId());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            logger.error("❌ Error creating event", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/")
    public ResponseEntity<List<EventDto>> getAll() {
        logger.info("📥 GET ALL EVENTS");
        List<EventDto> events = eventService.getAllEvents();
        logger.info("  Found {} events", events.size());
        return ResponseEntity.ok(events);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody EventDto dto) {
        try {
            EventDto updated = eventService.updateEvent(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.ok("Event deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth(Authentication auth) {
        logger.info("🧪 TEST AUTH ENDPOINT");
        logger.info("  Auth: {}", auth);
        logger.info("  Auth null: {}", auth == null);
        if (auth != null) {
            logger.info("  Auth principal: {}", auth.getPrincipal());
            logger.info("  Auth principal type: {}", auth.getPrincipal().getClass().getSimpleName());
            logger.info("  Auth credentials: {}", auth.getCredentials());
            logger.info("  Auth authorities: {}", auth.getAuthorities());
            logger.info("  Auth authenticated: {}", auth.isAuthenticated());
        }
        
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails) {
            return ResponseEntity.ok("✅ Authenticated as: " + ((AppUserDetails) auth.getPrincipal()).getUser().getEmail());
        }
        return ResponseEntity.status(401).body("❌ Not authenticated");
    }
}
