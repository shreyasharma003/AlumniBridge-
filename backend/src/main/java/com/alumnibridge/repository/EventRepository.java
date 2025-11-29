package com.alumnibridge.repository;

import com.alumnibridge.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByStartAtDesc();
    
    // Find all active events (upcoming and ongoing)
    @Query("SELECT e FROM Event e WHERE e.isActive = true AND (e.startAt >= :now OR e.endAt >= :now) ORDER BY e.startAt ASC")
    List<Event> findActiveEvents(LocalDateTime now);
    
    // Find all active events regardless of date
    List<Event> findByIsActiveTrueOrderByStartAtDesc();
    
    // Count registrations for an event
    @Query("SELECT COUNT(r) FROM EventRegistration r WHERE r.event.id = :eventId")
    Integer countRegistrationsByEventId(Long eventId);
}
