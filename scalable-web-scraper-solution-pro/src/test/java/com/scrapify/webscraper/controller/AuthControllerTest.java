```java
package com.scrapify.webscraper.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrapify.webscraper.config.JwtUtil;
import com.scrapify.webscraper.config.SecurityConfig;
import com.scrapify.webscraper.dto.AuthRequest;
import com.scrapify.webscraper.dto.AuthResponse;
import com.scrapify.webscraper.dto.UserRegistrationRequest;
import com.scrapify.webscraper.dto.UserResponse;
import com.scrapify.webscraper.exception.GlobalExceptionHandler;
import com.scrapify.webscraper.exception.UserAlreadyExistsException;
import com.scrapify.webscraper.model.Role;
import com.scrapify.webscraper.model.User;
import com.scrapify.webscraper.service.CustomUserDetailsService;
import com.scrapify.webscraper.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtUtil.class, GlobalExceptionHandler.class}) // Import necessary configs for Security
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void testLogin_Success() throws Exception {
        AuthRequest authRequest = new AuthRequest();
        authRequest.setUsername("testuser");
        authRequest.setPassword("password");

        User user = User.builder()
                .id(1L)
                .username("testuser")
                .password("encodedpassword")
                .email("test@example.com")
                .roles(Set.of(Role.USER))
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user); // Mocking UserDetails returned by auth manager
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        String expectedToken = jwtUtil.generateToken(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        AuthRequest authRequest = new AuthRequest();
        authRequest.setUsername("testuser");
        authRequest.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Incorrect username or password"));
    }

    @Test
    void testRegister_Success() throws Exception {
        UserRegistrationRequest registerRequest = new UserRegistrationRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("strongpass123");
        registerRequest.setEmail("newuser@example.com");

        UserResponse userResponse = UserResponse.builder()
                .id(2L)
                .username("newuser")
                .email("newuser@example.com")
                .roles(Set.of(Role.USER))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userService.registerNewUser(any(UserRegistrationRequest.class))).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@example.com"));
    }

    @Test
    void testRegister_UserAlreadyExists() throws Exception {
        UserRegistrationRequest registerRequest = new UserRegistrationRequest();
        registerRequest.setUsername("existinguser");
        registerRequest.setPassword("password");
        registerRequest.setEmail("existing@example.com");

        when(userService.registerNewUser(any(UserRegistrationRequest.class)))
                .thenThrow(new UserAlreadyExistsException("Username already taken"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username already taken"));
    }

    @Test
    void testRegister_InvalidInput() throws Exception {
        UserRegistrationRequest registerRequest = new UserRegistrationRequest();
        registerRequest.setUsername("short"); // too short
        registerRequest.setPassword("weak"); // too short
        registerRequest.setEmail("invalid-email"); // invalid format

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details").isArray());
    }
}
```