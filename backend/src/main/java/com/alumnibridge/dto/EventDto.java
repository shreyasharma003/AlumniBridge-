package com.alumnibridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class EventDto {
    private Long id;
    private String title;
    private String description;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate eventDate;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime eventTime;
    
    private String location;
    private String organizer;
    private String image;
    private Integer capacity;
    private Long createdBy;
    private String createdByName;
    private Boolean isActive = true;
    
    // Registration info
    private Integer registrationCount;
    private Boolean isRegistered;
    
    // Legacy fields for backward compatibility
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

