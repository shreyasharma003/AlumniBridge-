package com.alumnibridge.repository;

import com.alumnibridge.entity.EventRegistration;
import com.alumnibridge.entity.Event;
import com.alumnibridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEvent(Event event);
    Optional<EventRegistration> findByEventAndUser(Event event, User user);
    List<EventRegistration> findByUser(User user);
}
