package com.authsystem.controller;

import com.authsystem.dto.auth.LoginRequest;
import com.authsystem.dto.auth.RegisterRequest;
import com.authsystem.dto.auth.JwtAuthenticationResponse;
import com.authsystem.exception.InvalidCredentialsException;
import com.authsystem.exception.ResourceAlreadyExistsException;
import com.authsystem.service.AuthService;
import com.authsystem.util.AppConstants;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Use @WebMvcTest for testing Spring MVC controllers.
// It loads only components relevant to web layer (controllers, filters, etc.)
// and mocks out other services.
@WebMvcTest(AuthController.class)
@Import({AuthController.class}) // Explicitly import the controller
@DisplayName("AuthController WebMvc Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean(name = AppConstants.AUTH_RATE_LIMIT_BUCKET)
    private Bucket authRateLimitBucket;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUp() {
        // Initialize MockMvc with the web application context
        // This ensures all Spring MVC components are correctly set up
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Default behavior for rate limit bucket: allow consumption
        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(authRateLimitBucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);
    }

    @Test
    @DisplayName("Should register user successfully and return 201 Created")
    void shouldRegisterUserSuccessfully() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password123");

        doNothing().when(authService).registerUser(any(RegisterRequest.class));

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().string("User registered successfully!"));

        verify(authService, times(1)).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("Should return 400 Bad Request for invalid register request")
    void shouldReturnBadRequestForInvalidRegisterRequest() throws Exception {
        // Given
        RegisterRequest invalidRegisterRequest = new RegisterRequest(); // Missing fields
        invalidRegisterRequest.setUsername("ab"); // Too short
        invalidRegisterRequest.setEmail("invalid-email"); // Invalid email
        invalidRegisterRequest.setPassword("123"); // Too short

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRegisterRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.username").value("Username must be between 3 and 50 characters"))
                .andExpect(jsonPath("$.email").value("Email should be valid"))
                .andExpect(jsonPath("$.password").value("Password must be at least 6 characters long"));

        verify(authService, never()).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("Should return 409 Conflict if username already exists during registration")
    void shouldReturnConflictWhenUsernameExistsOnRegister() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("existinguser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password123");

        doThrow(new ResourceAlreadyExistsException("Username is already taken!"))
                .when(authService).registerUser(any(RegisterRequest.class));

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username is already taken!"));

        verify(authService, times(1)).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("Should authenticate user successfully and return 200 OK with JWT")
    void shouldAuthenticateUserSuccessfully() throws Exception {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        JwtAuthenticationResponse jwtResponse = new JwtAuthenticationResponse(
                "mockJwtToken", "Bearer", 1L, "testuser", "test@example.com", Arrays.asList("ROLE_USER")
        );

        when(authService.authenticateUser(any(LoginRequest.class))).thenReturn(jwtResponse);

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mockJwtToken"))
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authService, times(1)).authenticateUser(any(LoginRequest.class));
    }

    @Test
    @DisplayName("Should return 401 Unauthorized for invalid login credentials")
    void shouldReturnUnauthorizedForInvalidLogin() throws Exception {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("wronguser");
        loginRequest.setPassword("wrongpassword");

        doThrow(new InvalidCredentialsException("Invalid username/email or password."))
                .when(authService).authenticateUser(any(LoginRequest.class));

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username/email or password."));

        verify(authService, times(1)).authenticateUser(any(LoginRequest.class));
    }

    @Test
    @DisplayName("Should return 429 Too Many Requests when rate limit is exceeded for register")
    void shouldReturnTooManyRequestsForRegister() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password123");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(false);
        when(probe.getNanosToWaitForRefill()).thenReturn(Duration.ofSeconds(60).toNanos());
        when(authRateLimitBucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string("Too many requests. Please try again later."))
                .andExpect(header().string("X-Rate-Limit-Retry-After-Seconds", "60"));

        verify(authService, never()).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("Should return 429 Too Many Requests when rate limit is exceeded for login")
    void shouldReturnTooManyRequestsForLogin() throws Exception {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(false);
        when(probe.getNanosToWaitForRefill()).thenReturn(Duration.ofSeconds(30).toNanos());
        when(authRateLimitBucket.tryConsumeAndReturnRemaining(1)).thenReturn(probe);

        // When & Then
        mockMvc.perform(post(AppConstants.API_BASE + "/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("X-Rate-Limit-Retry-After-Seconds", "30"));

        verify(authService, never()).authenticateUser(any(LoginRequest.class));
    }
}
```

#### `frontend/src/App.test.js` (Frontend Unit Test Example)
```javascript