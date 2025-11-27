package com.alumnibridge.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ConnectionRequestDto {
    private Long id;
    private UserDto sender;
    private String status;
    private String createdAt;
}
