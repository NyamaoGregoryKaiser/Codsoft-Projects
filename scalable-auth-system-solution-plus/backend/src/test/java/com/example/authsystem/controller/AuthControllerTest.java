package com.example.authsystem.controller;

import com.example.authsystem.config.TestSecurityConfig;
import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.PasswordResetConfirmRequest;
import com.example.authsystem.dto.PasswordResetRequest;
import com.example.authsystem.dto.RefreshTokenRequest;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.exception.InvalidCredentialsException;
import com.example.authsystem.exception.ResourceNotFoundException;
import com.example.authsystem.exception.TokenRefreshException;
import com.example.authsystem.exception.UserAlreadyExistsException;
import com.example.authsystem.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class) // Import the test security config
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private AuthResponse createAuthResponse() {
        return AuthResponse.builder()
                .accessToken("mockAccessToken")
                .refreshToken("mockRefreshToken")
                .userId(1L)
                .username("testuser")
                .email("test@example.com")
                .roles(java.util.Set.of("USER"))
                .build();
    }

    @Test
    void registerUser_success() throws Exception {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123");
        AuthResponse response = createAuthResponse();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("mockAccessToken"))
                .andExpect(jsonPath("$.refreshToken").value("mockRefreshToken"))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void registerUser_alreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123");

        doThrow(new UserAlreadyExistsException("Email already registered")).when(authService).register(any(RegisterRequest.class));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void registerUser_invalidInput() throws Exception {
        RegisterRequest request = new RegisterRequest("", "invalid-email", "pass"); // Invalid username, email, password

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation Failed"))
                .andExpect(jsonPath("$.details.username").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    void loginUser_success() throws Exception {
        AuthRequest request = new AuthRequest("test@example.com", "password123");
        AuthResponse response = createAuthResponse();

        when(authService.login(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mockAccessToken"))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        verify(authService).login(any(AuthRequest.class));
    }

    @Test
    void loginUser_invalidCredentials() throws Exception {
        AuthRequest request = new AuthRequest("test@example.com", "wrongpassword");

        doThrow(new InvalidCredentialsException("Invalid email or password")).when(authService).login(any(AuthRequest.class));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void refreshToken_success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("validRefreshToken");
        AuthResponse response = createAuthResponse();

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mockAccessToken"))
                .andExpect(jsonPath("$.refreshToken").value("mockRefreshToken"));

        verify(authService).refreshToken(any(RefreshTokenRequest.class));
    }

    @Test
    void refreshToken_invalidToken() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("invalidRefreshToken");

        doThrow(new TokenRefreshException("Refresh token is not found or invalid!"))
                .when(authService).refreshToken(any(RefreshTokenRequest.class));

        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Refresh token is not found or invalid!"));
    }

    @Test
    void forgotPassword_success() throws Exception {
        PasswordResetRequest request = new PasswordResetRequest("user@example.com");
        doNothing().when(authService).requestPasswordReset(any(String.class));

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("If an account with that email exists, a password reset link has been sent."));

        verify(authService).requestPasswordReset(request.getEmail());
    }

    @Test
    void resetPassword_success() throws Exception {
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest("validToken", "newPassword123");
        doNothing().when(authService).confirmPasswordReset(any(String.class), any(String.class));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Password has been reset successfully."));

        verify(authService).confirmPasswordReset(request.getToken(), request.getNewPassword());
    }

    @Test
    void resetPassword_invalidToken() throws Exception {
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest("invalidToken", "newPassword123");
        doThrow(new ResourceNotFoundException("Password reset token is invalid or expired."))
                .when(authService).confirmPasswordReset(any(String.class), any(String.class));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Password reset token is invalid or expired."));
    }

    @Test
    void resetPassword_expiredToken() throws Exception {
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest("expiredToken", "newPassword123");
        doThrow(new IllegalArgumentException("Password reset token is expired. Please request a new one."))
                .when(authService).confirmPasswordReset(any(String.class), any(String.class));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password reset token is expired. Please request a new one."));
    }
}