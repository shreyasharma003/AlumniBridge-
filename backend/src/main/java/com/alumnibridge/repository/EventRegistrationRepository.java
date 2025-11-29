package com.alumnibridge.repository;

import com.alumnibridge.entity.EventRegistration;
import com.alumnibridge.entity.Event;
import com.alumnibridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEvent(Event event);
    Optional<EventRegistration> findByEventAndUser(Event event, User user);
    List<EventRegistration> findByUser(User user);
    
    // Check if user is registered for an event
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
    
    // Find by event ID
    List<EventRegistration> findByEventId(Long eventId);
    
    // Find by user ID
    List<EventRegistration> findByUserId(Long userId);
    
    // Count registrations for an event
    int countByEventId(Long eventId);
    
    // Delete registration
    void deleteByEventIdAndUserId(Long eventId, Long userId);
    
    // Get all event IDs that a user is registered for
    @Query("SELECT r.event.id FROM EventRegistration r WHERE r.user.id = :userId")
    List<Long> findEventIdsByUserId(Long userId);
}
