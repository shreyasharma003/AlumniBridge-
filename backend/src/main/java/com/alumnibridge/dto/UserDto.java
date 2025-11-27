package com.alumnibridge.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String institute;
    private Integer batchYear;
    private String degreeName;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String bio;
    private String headline;
    private String skills;
    private String location;
    private String pictureUrl;
}
