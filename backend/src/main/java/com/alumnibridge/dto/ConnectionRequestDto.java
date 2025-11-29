package com.alumnibridge.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ConnectionRequestDto {
    private Long id;
    private UserDto sender;
    private UserDto receiver;
    private String status;
    private String createdAt;
}
