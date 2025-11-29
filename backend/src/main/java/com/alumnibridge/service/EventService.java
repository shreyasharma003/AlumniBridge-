package com.alumnibridge.service;

import com.alumnibridge.dto.EventDto;
import com.alumnibridge.entity.Event;
import java.util.List;

public interface EventService {
    EventDto createEvent(EventDto dto, Long creatorId);
    List<EventDto> getAllEvents();
    List<EventDto> getActiveEvents(Long userId);
    EventDto getEventById(Long eventId, Long userId);
    EventDto updateEvent(Long eventId, EventDto dto);
    void deleteEvent(Long eventId);
    void registerEvent(Long eventId, Long userId);
    void unregisterEvent(Long eventId, Long userId);
    boolean isUserRegistered(Long eventId, Long userId);
    List<Long> getUserRegisteredEventIds(Long userId);
    Integer getRegistrationCount(Long eventId);
    List<EventDto> getRegisteredEvents(Long userId);
}

