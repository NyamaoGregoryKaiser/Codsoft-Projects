package com.example.chat.controller;

import com.example.chat.dto.ChatRoomCreationDto;
import com.example.chat.dto.LoginRequest;
import com.example.chat.dto.RegisterRequest;
import com.example.chat.entity.User;
import com.example.chat.repository.ChatRoomRepository;
import com.example.chat.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional // Rollback changes after each test
class ChatRoomControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpassword");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // For integration tests
        registry.add("jwt.secret", () -> "aVerySecureTestSecretKeyForIntegrationTests1234567890");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    private String jwtToken;
    private Long testUserId;

    @BeforeEach
    void setUp() throws Exception {
        // Clear repositories to ensure a clean state for each test
        chatRoomRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();

        // 1. Register a test user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser_int");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test_int@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Get the ID of the registered user
        User user = userRepository.findByUsername("testuser_int").orElseThrow();
        testUserId = user.getId();

        // 2. Log in the test user to get a JWT token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser_int");
        loginRequest.setPassword("password123");

        String responseString = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, String> response = objectMapper.readValue(responseString, HashMap.class);
        jwtToken = response.get("token");
    }

    @Test
    @DisplayName("Should create a new chat room and return 201 Created")
    void shouldCreateChatRoom() throws Exception {
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName("Test Room");
        createDto.setDescription("A room for testing.");

        mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test Room")))
                .andExpect(jsonPath("$.creator.username", is("testuser_int")));
    }

    @Test
    @DisplayName("Should return 400 Bad Request if chat room name is missing")
    void shouldReturnBadRequestWhenChatRoomNameIsMissing() throws Exception {
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName(""); // Empty name
        createDto.setDescription("A room for testing.");

        mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name", is("Chat room name is required")));
    }

    @Test
    @DisplayName("Should get all chat rooms for the authenticated user")
    void shouldGetChatRoomsForUser() throws Exception {
        // Create a chat room first
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName("My Private Room");
        createDto.setDescription("Just for me.");

        mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/chatrooms/my-rooms")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("My Private Room")));
    }

    @Test
    @DisplayName("Should get a specific chat room by ID if user is participant")
    void shouldGetSpecificChatRoomById() throws Exception {
        // Create a chat room and get its ID
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName("Specific Room");
        createDto.setDescription("Details.");

        String createRoomResponse = mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> roomResponse = objectMapper.readValue(createRoomResponse, HashMap.class);
        Integer roomId = (Integer) roomResponse.get("id");

        mockMvc.perform(get("/api/chatrooms/{id}", roomId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Specific Room")));
    }

    @Test
    @DisplayName("Should return 403 Forbidden if user is not a participant of the chat room")
    void shouldReturnForbiddenWhenUserNotParticipant() throws Exception {
        // Create a chat room by user A
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName("Exclusive Room");
        createDto.setDescription("Only for creator.");

        mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated());

        // Register and login user B
        RegisterRequest registerRequestB = new RegisterRequest();
        registerRequestB.setUsername("userB");
        registerRequestB.setPassword("password123");
        registerRequestB.setEmail("userb@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequestB)))
                .andExpect(status().isCreated());

        LoginRequest loginRequestB = new LoginRequest();
        loginRequestB.setUsername("userB");
        loginRequestB.setPassword("password123");

        String responseStringB = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequestB)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, String> responseB = objectMapper.readValue(responseStringB, HashMap.class);
        String jwtTokenB = responseB.get("token");

        // Attempt for user B to access user A's room (where B is not a participant)
        // We need the room ID of user A's room. Re-fetch current user's rooms or get it from initial creation response
        String userARoomsResponse = mockMvc.perform(get("/api/chatrooms/my-rooms")
                        .header("Authorization", "Bearer " + jwtToken))
                .andReturn().getResponse().getContentAsString();
        Map<String, Object>[] userARooms = objectMapper.readValue(userARoomsResponse, Map[].class);
        Integer userARoomId = (Integer) userARooms[0].get("id");


        mockMvc.perform(get("/api/chatrooms/{id}", userARoomId)
                        .header("Authorization", "Bearer " + jwtTokenB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("User is not authorized to access chat room with ID: " + userARoomId)));
    }

    @Test
    @DisplayName("Should add a participant to a chat room")
    void shouldAddParticipantToChatRoom() throws Exception {
        // Create a chat room by user A (testuser_int)
        ChatRoomCreationDto createDto = new ChatRoomCreationDto();
        createDto.setName("Room to add participant");
        createDto.setDescription("Description.");

        String createRoomResponse = mockMvc.perform(post("/api/chatrooms")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> roomResponse = objectMapper.readValue(createRoomResponse, HashMap.class);
        Integer chatRoomId = (Integer) roomResponse.get("id");

        // Register and get ID of user B
        RegisterRequest registerRequestB = new RegisterRequest();
        registerRequestB.setUsername("user_to_add");
        registerRequestB.setPassword("password123");
        registerRequestB.setEmail("add@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequestB)))
                .andExpect(status().isCreated());

        User userToAdd = userRepository.findByUsername("user_to_add").orElseThrow();
        Long userToAddId = userToAdd.getId();

        // Add user B to the chat room
        mockMvc.perform(post("/api/chatrooms/{chatRoomId}/participants/{userId}", chatRoomId, userToAddId)
                        .header("Authorization", "Bearer " + jwtToken) // Authenticated by user A
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participants", hasSize(2))) // Creator + new participant
                .andExpect(jsonPath("$.participants[?(@.username == 'user_to_add')]", hasSize(1)));

        // Verify user B can now access the room
        LoginRequest loginRequestB = new LoginRequest();
        loginRequestB.setUsername("user_to_add");
        loginRequestB.setPassword("password123");

        String responseStringB = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequestB)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Map<String, String> responseB = objectMapper.readValue(responseStringB, HashMap.class);
        String jwtTokenB = responseB.get("token");

        mockMvc.perform(get("/api/chatrooms/{id}", chatRoomId)
                        .header("Authorization", "Bearer " + jwtTokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Room to add participant")));
    }
}