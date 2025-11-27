package com.alumnibridge.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterDto {
    @NotBlank
    private String name;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min=6)
    private String password;

    @NotNull
    private String role; // STUDENT or ALUMNI

    private String institute;

    private Integer batchYear;

    private String degreeName;

    private String linkedinUrl;

    private String bio;
}
