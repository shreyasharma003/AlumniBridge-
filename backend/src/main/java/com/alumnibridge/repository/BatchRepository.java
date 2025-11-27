package com.alumnibridge.repository;

import com.alumnibridge.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByYear(Integer year);
}
