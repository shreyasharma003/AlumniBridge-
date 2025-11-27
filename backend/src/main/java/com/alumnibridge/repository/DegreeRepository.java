package com.alumnibridge.repository;

import com.alumnibridge.entity.Degree;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DegreeRepository extends JpaRepository<Degree, Long> {
    // Use findFirstByName to handle potential duplicates in the database
    Optional<Degree> findFirstByName(String name);
}
