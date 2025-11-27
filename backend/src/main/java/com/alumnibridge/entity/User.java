package com.alumnibridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String email;

    @Column(nullable=false)
    private String password;

    @Column(nullable=false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToOne(cascade = CascadeType.ALL, mappedBy = "user", fetch=FetchType.LAZY)
    private Profile profile;

    @Column(nullable = false)
    private boolean enabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    // For tracking online/active status
    private LocalDateTime lastActiveAt;

    // Check if user is online (active within last 5 minutes)
    public boolean isOnline() {
        if (lastActiveAt == null) return false;
        return lastActiveAt.isAfter(LocalDateTime.now().minusMinutes(5));
    }

    public enum Role {
        STUDENT, ALUMNI, ADMIN
    }
}
