package com.taskmanager.system.service;

import com.taskmanager.system.dto.auth.JwtAuthResponse;
import com.taskmanager.system.dto.auth.LoginDto;
import com.taskmanager.system.dto.auth.RegisterDto;

public interface AuthService {
    JwtAuthResponse login(LoginDto loginDto);
    String register(RegisterDto registerDto);
}