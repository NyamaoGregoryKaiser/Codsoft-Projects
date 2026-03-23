```java
package com.tasksyncpro.tasksyncpro.controller;

import com.tasksyncpro.tasksyncpro.dto.AuthRequest;
import com.tasksyncpro.tasksyncpro.dto.AuthResponse;
import com.tasksyncpro.tasksyncpro.dto.RegisterRequest;
import com.tasksyncpro.tasksyncpro.entity.Role;
import com.tasksyncpro.tasksyncpro.entity.User;
import com.tasksyncpro.tasksyncpro.repository.RoleRepository;
import com.tasksyncpro.tasksyncpro.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Set;
import java.util.stream.Collectors;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Testcontainers setup
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("tasksyncpro_test_db")
            .withUsername("test_user")
            .withPassword("test_password");

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost:" + port;
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Ensure roles exist for setup
        roleRepository.save(new Role(Role.RoleName.USER));
        roleRepository.save(new Role(Role.RoleName.ADMIN));
    }

    @Test
    void registerUser_success() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(201)
            .body("token", notNullValue())
            .body("username", equalTo("newuser"))
            .body("roles", containsInAnyOrder("USER"));

        // Verify user exists in DB
        assertTrue(userRepository.findByUsername("newuser").isPresent());
    }

    @Test
    void registerUser_usernameTaken() {
        // Register first user
        User existingUser = new User();
        existingUser.setUsername("existing");
        existingUser.setEmail("existing@example.com");
        existingUser.setPassword(passwordEncoder.encode("password"));
        existingUser.setRoles(Set.of(roleRepository.findByName(Role.RoleName.USER).get()));
        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing"); // Duplicate username
        request.setEmail("another@example.com");
        request.setPassword("password123");

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(400)
            .body("message", equalTo("Username already taken."));
    }

    @Test
    void loginUser_success() {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("testpass");
        given().contentType(ContentType.JSON).body(registerRequest).post("/api/auth/register").then().statusCode(201);

        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setIdentifier("testuser");
        loginRequest.setPassword("testpass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("token", notNullValue())
            .body("username", equalTo("testuser"))
            .body("roles", containsInAnyOrder("USER"));
    }

    @Test
    void loginUser_invalidCredentials() {
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setIdentifier("nonexistent");
        loginRequest.setPassword("wrongpass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(401)
            .body("error", equalTo("Unauthorized"))
            .body("message", equalTo("Invalid username/email or password"));
    }

    @Test
    void loginUser_withEmail_success() {
        // Register user first
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuseremail");
        registerRequest.setEmail("testemail@example.com");
        registerRequest.setPassword("testpass");
        given().contentType(ContentType.JSON).body(registerRequest).post("/api/auth/register").then().statusCode(201);

        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setIdentifier("testemail@example.com"); // Login with email
        loginRequest.setPassword("testpass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .body("token", notNullValue())
            .body("username", equalTo("testuseremail"))
            .body("roles", containsInAnyOrder("USER"));
    }

    // Helper to get admin token for other tests requiring authentication
    public String getAdminToken() {
        User adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@test.com");
        adminUser.setPassword(passwordEncoder.encode("adminpass"));
        adminUser.setRoles(Set.of(roleRepository.findByName(Role.RoleName.ADMIN).get(), roleRepository.findByName(Role.RoleName.USER).get()));
        userRepository.save(adminUser);

        AuthRequest loginRequest = new AuthRequest("admin", "adminpass");
        return given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract().as(AuthResponse.class).getToken();
    }
}
```