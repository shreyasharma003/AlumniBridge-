package com.alumnibridge.controller;

import com.alumnibridge.entity.Degree;
import com.alumnibridge.repository.DegreeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DegreeController {

    private final DegreeRepository degreeRepository;

    public DegreeController(DegreeRepository degreeRepository) {
        this.degreeRepository = degreeRepository;
    }

    @GetMapping("/degrees")
    public List<Degree> getAllDegrees() {
        return degreeRepository.findAll();
    }
}
