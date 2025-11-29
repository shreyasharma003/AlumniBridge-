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
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    private final EventService eventService;
    
    public EventController(EventService es) { 
        this.eventService = es; 
    }

    // Create a new event (Admin only)
    @PostMapping("/")
    public ResponseEntity<?> createEvent(@RequestBody EventDto dto, Authentication auth) {
        logger.info("📝 CREATE EVENT REQUEST");
        logger.info("  Title: {}", dto.getTitle());
        logger.info("  Date: {}", dto.getEventDate());
        logger.info("  Time: {}", dto.getEventTime());
        logger.info("  Auth: {}", auth);
        
        Long creatorId = getUserIdFromAuth(auth);
        if (creatorId == null) {
            logger.error("❌ User not authenticated - auth object: {}", auth);
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated", "message", "Please login to create events"));
        }
        
        try {
            EventDto res = eventService.createEvent(dto, creatorId);
            logger.info("✅ Event created with ID: {}", res.getId());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            logger.error("❌ Error creating event", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "message", "Failed to create event"));
        }
    }

    // Get all events (Admin view - shows all including inactive)
    @GetMapping("/")
    public ResponseEntity<List<EventDto>> getAll() {
        logger.info("📥 GET ALL EVENTS");
        List<EventDto> events = eventService.getAllEvents();
        logger.info("  Found {} events", events.size());
        return ResponseEntity.ok(events);
    }
    
    // Get all events (alias for admin)
    @GetMapping("/all")
    public ResponseEntity<List<EventDto>> getAllEvents() {
        logger.info("📥 GET ALL EVENTS (admin endpoint)");
        List<EventDto> events = eventService.getAllEvents();
        logger.info("  Found {} events", events.size());
        return ResponseEntity.ok(events);
    }
    
    // Get active events (Student/Alumni view)
    @GetMapping("/active")
    public ResponseEntity<List<EventDto>> getActiveEvents(Authentication auth) {
        logger.info("📥 GET ACTIVE EVENTS");
        Long userId = getUserIdFromAuth(auth);
        List<EventDto> events = eventService.getActiveEvents(userId);
        logger.info("  Found {} active events", events.size());
        return ResponseEntity.ok(events);
    }
    
    // Get single event by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id, Authentication auth) {
        try {
            Long userId = getUserIdFromAuth(auth);
            EventDto event = eventService.getEventById(id, userId);
            return ResponseEntity.ok(event);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Update event (Admin only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody EventDto dto) {
        logger.info("📝 UPDATE EVENT: {}", id);
        try {
            EventDto updated = eventService.updateEvent(id, dto);
            logger.info("✅ Event updated: {}", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("❌ Error updating event", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Update event (alias endpoint)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateEventAlias(@PathVariable Long id, @RequestBody EventDto dto) {
        return updateEvent(id, dto);
    }

    // Delete event (Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        logger.info("🗑️ DELETE EVENT: {}", id);
        try {
            eventService.deleteEvent(id);
            logger.info("✅ Event deleted: {}", id);
            return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
        } catch (Exception e) {
            logger.error("❌ Error deleting event", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Delete event (alias endpoint)
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteEventAlias(@PathVariable Long id) {
        return deleteEvent(id);
    }
    
    // Register for an event
    @PostMapping("/register/{eventId}")
    public ResponseEntity<?> registerForEvent(@PathVariable Long eventId, Authentication auth) {
        logger.info("📝 REGISTER FOR EVENT: {}", eventId);
        
        Long userId = getUserIdFromAuth(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        try {
            eventService.registerEvent(eventId, userId);
            logger.info("✅ User {} registered for event {}", userId, eventId);
            return ResponseEntity.ok(Map.of(
                "message", "Successfully registered for event",
                "eventId", eventId,
                "userId", userId
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("❌ Error registering for event", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Unregister from an event
    @PostMapping("/unregister/{eventId}")
    public ResponseEntity<?> unregisterFromEvent(@PathVariable Long eventId, Authentication auth) {
        logger.info("📝 UNREGISTER FROM EVENT: {}", eventId);
        
        Long userId = getUserIdFromAuth(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        try {
            eventService.unregisterEvent(eventId, userId);
            logger.info("✅ User {} unregistered from event {}", userId, eventId);
            return ResponseEntity.ok(Map.of(
                "message", "Successfully unregistered from event",
                "eventId", eventId
            ));
        } catch (Exception e) {
            logger.error("❌ Error unregistering from event", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Check if user is registered for an event
    @GetMapping("/check-registration/{eventId}")
    public ResponseEntity<?> checkRegistration(@PathVariable Long eventId, Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        boolean isRegistered = eventService.isUserRegistered(eventId, userId);
        return ResponseEntity.ok(Map.of(
            "eventId", eventId,
            "userId", userId,
            "isRegistered", isRegistered
        ));
    }
    
    // Get all event IDs user is registered for
    @GetMapping("/my-registrations")
    public ResponseEntity<?> getMyRegistrations(Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        List<Long> eventIds = eventService.getUserRegisteredEventIds(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "registeredEventIds", eventIds
        ));
    }
    
    // Get events user is registered for
    @GetMapping("/registered")
    public ResponseEntity<?> getRegisteredEvents(Authentication auth) {
        Long userId = getUserIdFromAuth(auth);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        List<EventDto> events = eventService.getRegisteredEvents(userId);
        return ResponseEntity.ok(events);
    }
    
    // Get registration count for an event
    @GetMapping("/registrations/{eventId}/count")
    public ResponseEntity<?> getRegistrationCount(@PathVariable Long eventId) {
        Integer count = eventService.getRegistrationCount(eventId);
        return ResponseEntity.ok(Map.of(
            "eventId", eventId,
            "count", count
        ));
    }

    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth(Authentication auth) {
        logger.info("🧪 TEST AUTH ENDPOINT");
        
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails) {
            return ResponseEntity.ok("✅ Authenticated as: " + ((AppUserDetails) auth.getPrincipal()).getUser().getEmail());
        }
        return ResponseEntity.status(401).body("❌ Not authenticated");
    }
    
    // Helper method to extract user ID from Authentication
    private Long getUserIdFromAuth(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails) {
            return ((AppUserDetails) auth.getPrincipal()).getUser().getId();
        }
        return null;
    }
}
