package com.alumnibridge.service;

import com.alumnibridge.dto.*;

public interface AuthService {
    AuthResponse register(RegisterDto dto);
    AuthResponse login(String email, String password);
}
