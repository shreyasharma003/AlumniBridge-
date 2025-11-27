package com.alumnibridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "degrees")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Degree {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
}
