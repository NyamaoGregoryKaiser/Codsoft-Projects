```java
package com.tasks.taskmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tasks.taskmanagement.dto.AuthRequest;
import com.tasks.taskmanagement.dto.RegisterRequest;
import com.tasks.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthControllerApiTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15.3")
            .withDatabaseName("testdb_api")
            .withUsername("testuser_api")
            .withPassword("testpass_api");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository; // To clean up and verify creation

    @BeforeEach
    void setUp() {
        userRepository.deleteAll(); // Clean up before each test
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void registerUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("newuser", "newuser@example.com", "password123", "New", "User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    @DisplayName("Should fail registration if username already exists")
    void registerUser_DuplicateUsername() throws Exception {
        // Register first user
        RegisterRequest firstRequest = new RegisterRequest("existinguser", "first@example.com", "password123", null, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated());

        // Attempt to register with same username
        RegisterRequest secondRequest = new RegisterRequest("existinguser", "second@example.com", "password123", null, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username 'existinguser' is already taken."));
    }

    @Test
    @DisplayName("Should login with correct credentials successfully (username)")
    void loginUser_Success_Username() throws Exception {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest("loginuser", "login@example.com", "securepass", null, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Then login
        AuthRequest authRequest = new AuthRequest("loginuser", "securepass");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.username").value("loginuser"));
    }

    @Test
    @DisplayName("Should login with correct credentials successfully (email)")
    void loginUser_Success_Email() throws Exception {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest("emailloginuser", "email_login@example.com", "securepass", null, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Then login using email
        AuthRequest authRequest = new AuthRequest("email_login@example.com", "securepass");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.username").value("emailloginuser")); // Response will contain username
    }


    @Test
    @DisplayName("Should fail login with incorrect password")
    void loginUser_InvalidPassword() throws Exception {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest("badpassuser", "badpass@example.com", "correctpass", null, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Attempt login with wrong password
        AuthRequest authRequest = new AuthRequest("badpassuser", "wrongpass");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username/email or password."));
    }

    @Test
    @DisplayName("Should return Bad Request for invalid registration data")
    void registerUser_InvalidData() throws Exception {
        RegisterRequest request = new RegisterRequest("us", "invalid-email", "short", null, null); // Invalid username, email, password

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation Failed"))
                .andExpect(jsonPath("$.details").value(notNullValue()));
    }
}
```