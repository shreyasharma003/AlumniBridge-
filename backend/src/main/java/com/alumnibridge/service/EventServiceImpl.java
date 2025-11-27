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
        User creator = userRepository.findById(creatorId).orElseThrow(() -> new ResourceNotFoundException("Creator not found"));
        Event e = new Event();
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        
        // Convert date/time to LocalDateTime
        if (dto.getEventDate() != null && dto.getEventTime() != null) {
            e.setStartAt(LocalDateTime.of(dto.getEventDate(), dto.getEventTime()));
        } else if (dto.getStartAt() != null) {
            e.setStartAt(dto.getStartAt());
        }
        
        e.setLocation(dto.getLocation());
        e.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 100);
        e.setCreatedBy(creator);
        eventRepository.save(e);
        
        return convertToDto(e);
    }

    @Override
    public List<EventDto> getAllEvents() {
        return eventRepository.findAllByOrderByStartAtDesc().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    public EventDto updateEvent(Long eventId, EventDto dto) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        
        // Convert date/time to LocalDateTime
        if (dto.getEventDate() != null && dto.getEventTime() != null) {
            e.setStartAt(LocalDateTime.of(dto.getEventDate(), dto.getEventTime()));
        }
        
        e.setLocation(dto.getLocation());
        e.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 100);
        
        eventRepository.save(e);
        return convertToDto(e);
    }

    public void deleteEvent(Long eventId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        eventRepository.delete(e);
    }

    @Override
    public void registerEvent(Long eventId, Long userId) {
        Event e = eventRepository.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User u = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        eventRegRepository.findByEventAndUser(e, u).ifPresentOrElse(x -> {
            throw new IllegalArgumentException("Already registered");
        }, () -> {
            EventRegistration er = new EventRegistration();
            er.setEvent(e);
            er.setUser(u);
            eventRegRepository.save(er);
        });
    }

    private EventDto convertToDto(Event e) {
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
        d.setCapacity(e.getCapacity());
        d.setCreatedBy(e.getCreatedBy() != null ? e.getCreatedBy().getId() : null);
        return d;
    }
}

