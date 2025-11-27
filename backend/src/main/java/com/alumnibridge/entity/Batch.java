package com.alumnibridge.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Table(name = "batches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Batch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer year;
    
    @OneToMany(mappedBy = "batch", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Profile> profiles;
}
