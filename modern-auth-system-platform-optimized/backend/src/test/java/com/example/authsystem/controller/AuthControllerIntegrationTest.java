```java
package com.example.authsystem.controller;

import com.example.authsystem.AuthenticationSystemApplication;
import com.example.authsystem.dto.AuthRequest;
import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.RegisterRequest;
import com.example.authsystem.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = AuthenticationSystemApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@Transactional // Rollback changes after each test
class AuthControllerIntegrationTest {

    @Container
    public static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpassword");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // For integration tests
        registry.add("spring.flyway.enabled", () -> "false"); // Disable Flyway for clean test schema
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        // Ensure clean state before each test, especially with @Transactional
        // If not using @Transactional, you'd clear repos here
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should register a new user and return tokens")
    void register_Success() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Test")
                .lastName("User")
                .email("test.user@example.com")
                .password("testpassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));

        assertThat(userRepository.existsByEmail("test.user@example.com")).isTrue();
    }

    @Test
    @DisplayName("Should fail to register user if email already exists")
    void register_UserAlreadyExists() throws Exception {
        // First register a user
        register_Success(); // This calls the registration logic

        RegisterRequest duplicateRequest = RegisterRequest.builder()
                .firstName("Another")
                .lastName("User")
                .email("test.user@example.com") // Same email
                .password("anotherpassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("User with email test.user@example.com already exists."));
    }

    @Test
    @DisplayName("Should log in a registered user and return tokens")
    void login_Success() throws Exception {
        // First, register a user
        register_Success();

        AuthRequest authRequest = AuthRequest.builder()
                .email("test.user@example.com")
                .password("testpassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    @DisplayName("Should fail to log in with invalid credentials")
    void login_InvalidCredentials() throws Exception {
        // First, register a user
        register_Success();

        AuthRequest authRequest = AuthRequest.builder()
                .email("test.user@example.com")
                .password("wrongpassword") // Wrong password
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    // TODO: Add refresh token test (requires mocking JWT expiration or using a shorter expiration for test)
    // TODO: Add test for /api/users/{id} with correct/incorrect roles
}
```