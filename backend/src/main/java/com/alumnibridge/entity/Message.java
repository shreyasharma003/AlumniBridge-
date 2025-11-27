package com.alumnibridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // sender
    @ManyToOne
    @JoinColumn(name="sender_id")
    private User sender;

    // receiver
    @ManyToOne
    @JoinColumn(name="receiver_id")
    private User receiver;

    @Column(length = 2000)
    private String content;

    private boolean isEventLink;

    private Long eventId; // optional

    private LocalDateTime sentAt = LocalDateTime.now();
}
