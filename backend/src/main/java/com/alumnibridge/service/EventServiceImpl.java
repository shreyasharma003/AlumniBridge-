package com.alumnibridge.service;

import com.alumnibridge.dto.EventDto;
import com.alumnibridge.entity.*;
import com.alumnibridge.exception.ResourceNotFoundException;
import com.alumnibridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventRegistrationRepository eventRegRepository;

    public EventServiceImpl(EventRepository er, UserRepository ur, EventRegistrationRepository arr) {
        this.eventRepository = er;
        this.userRepository = ur;
        this.eventRegRepository = arr;
    }

    @Override
    public EventDto createEvent(EventDto dto, Long creatorId) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));
        
        Event e = new Event();
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        
        // Convert date/time to LocalDateTime
        if (dto.getEventDate() != null && dto.getEventTime() != null) {
            e.setStartAt(LocalDateTime.of(dto.getEventDate(), dto.getEventTime()));
        } else if (dto.getStartAt() != null) {
            e.setStartAt(dto.getStartAt());
        }
        
        // Set endAt
        if (dto.getEndAt() != null) {
            e.setEndAt(dto.getEndAt());
        }
        
        e.setLocation(dto.getLocation());
        e.setOrganizer(dto.getOrganizer());
        e.setImage(dto.getImage());
        e.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 100);
        e.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        e.setCreatedBy(creator);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        
        eventRepository.save(e);
        return convertToDto(e, null);
    }

    @Override
    public List<EventDto> getAllEvents() {
        return eventRepository.findAllByOrderByStartAtDesc().stream()
            .map(e -> convertToDto(e, null))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<EventDto> getActiveEvents(Long userId) {
        return eventRepository.findByIsActiveTrueOrderByStartAtDesc().stream()
            .map(e -> convertToDto(e, userId))
            .collect(Collectors.toList());
    }
    
    @Override
    public EventDto getEventById(Long eventId, Long userId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        return convertToDto(e, userId);
    }

    @Override
    public EventDto updateEvent(Long eventId, EventDto dto) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        
        // Convert date/time to LocalDateTime
        if (dto.getEventDate() != null && dto.getEventTime() != null) {
            e.setStartAt(LocalDateTime.of(dto.getEventDate(), dto.getEventTime()));
        } else if (dto.getStartAt() != null) {
            e.setStartAt(dto.getStartAt());
        }
        
        // Set endAt
        if (dto.getEndAt() != null) {
            e.setEndAt(dto.getEndAt());
        }
        
        e.setLocation(dto.getLocation());
        e.setOrganizer(dto.getOrganizer());
        e.setImage(dto.getImage());
        e.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 100);
        e.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        e.setUpdatedAt(LocalDateTime.now());
        
        eventRepository.save(e);
        return convertToDto(e, null);
    }

    @Override
    public void deleteEvent(Long eventId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        // Delete all registrations first
        List<EventRegistration> registrations = eventRegRepository.findByEventId(eventId);
        eventRegRepository.deleteAll(registrations);
        
        eventRepository.delete(e);
    }

    @Override
    public void registerEvent(Long eventId, Long userId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User u = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if already registered
        if (eventRegRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new IllegalArgumentException("Already registered for this event");
        }
        
        // Check capacity
        int currentCount = eventRegRepository.countByEventId(eventId);
        if (e.getCapacity() != null && currentCount >= e.getCapacity()) {
            throw new IllegalArgumentException("Event is at full capacity");
        }
        
        EventRegistration er = new EventRegistration();
        er.setEvent(e);
        er.setUser(u);
        er.setRegisteredAt(LocalDateTime.now());
        eventRegRepository.save(er);
    }
    
    @Override
    public void unregisterEvent(Long eventId, Long userId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User u = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        EventRegistration registration = eventRegRepository.findByEventAndUser(e, u)
            .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        
        eventRegRepository.delete(registration);
    }
    
    @Override
    public boolean isUserRegistered(Long eventId, Long userId) {
        return eventRegRepository.existsByEventIdAndUserId(eventId, userId);
    }
    
    @Override
    public List<Long> getUserRegisteredEventIds(Long userId) {
        return eventRegRepository.findEventIdsByUserId(userId);
    }
    
    @Override
    public Integer getRegistrationCount(Long eventId) {
        return eventRegRepository.countByEventId(eventId);
    }
    
    @Override
    public List<EventDto> getRegisteredEvents(Long userId) {
        List<EventRegistration> registrations = eventRegRepository.findByUserId(userId);
        return registrations.stream()
            .map(r -> convertToDto(r.getEvent(), userId))
            .collect(Collectors.toList());
    }

    private EventDto convertToDto(Event e, Long userId) {
        EventDto d = new EventDto();
        d.setId(e.getId());
        d.setTitle(e.getTitle());
        d.setDescription(e.getDescription());
        d.setStartAt(e.getStartAt());
        
        if (e.getStartAt() != null) {
            d.setEventDate(e.getStartAt().toLocalDate());
            d.setEventTime(e.getStartAt().toLocalTime());
        }
        
        d.setLocation(e.getLocation());
        d.setOrganizer(e.getOrganizer());
        d.setImage(e.getImage());
        d.setCapacity(e.getCapacity());
        d.setIsActive(e.getIsActive());
        d.setCreatedBy(e.getCreatedBy() != null ? e.getCreatedBy().getId() : null);
        d.setCreatedByName(e.getCreatedBy() != null ? e.getCreatedBy().getName() : null);
        d.setCreatedAt(e.getCreatedAt());
        d.setUpdatedAt(e.getUpdatedAt());
        
        // Add registration info
        d.setRegistrationCount(eventRegRepository.countByEventId(e.getId()));
        if (userId != null) {
            d.setIsRegistered(eventRegRepository.existsByEventIdAndUserId(e.getId(), userId));
        }
        
        return d;
    }
}

