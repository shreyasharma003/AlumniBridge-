package com.alumnibridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private String location;
    
    private Integer capacity = 100;

    @ManyToOne
    @JoinColumn(name="created_by")
    private User createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();
}
