```java
package com.mlutil.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mlutil.auth.dto.LoginRequest;
import com.mlutil.auth.dto.SignUpRequest;
import com.mlutil.auth.entity.Role;
import com.mlutil.auth.entity.User;
import com.mlutil.auth.repository.RoleRepository;
import com.mlutil.auth.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collections;
import java.util.Set;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.is;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Container
    public static PostgreSQLContainer<?> postgresContainer = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpassword");

    @DynamicPropertySource
    static void setDatasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgresContainer::getUsername);
        registry.add("spring.datasource.password", postgresContainer::getPassword);
        registry.add("spring.flyway.enabled", () -> "true"); // Ensure Flyway runs for tests
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        userRepository.deleteAll(); // Clean up before each test
        roleRepository.deleteAll();

        // Ensure roles exist for testing
        if (roleRepository.findByName(Role.RoleName.ROLE_USER).isEmpty()) {
            roleRepository.save(new Role(null, Role.RoleName.ROLE_USER));
        }
        if (roleRepository.findByName(Role.RoleName.ROLE_ADMIN).isEmpty()) {
            roleRepository.save(new Role(null, Role.RoleName.ROLE_ADMIN));
        }

        // Create a test user for login scenarios
        User adminUser = new User(null, "Admin", "admin_test", "admin_test@example.com", passwordEncoder.encode("admin_pass"));
        Set<Role> adminRoles = Collections.singleton(roleRepository.findByName(Role.RoleName.ROLE_ADMIN).get());
        adminUser.setRoles(adminRoles);
        userRepository.save(adminUser);
    }

    @Test
    @DisplayName("Should register a new user successfully")
    void signUp_Success() {
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setName("Test User");
        signUpRequest.setUsername("testuser");
        signUpRequest.setEmail("test@example.com");
        signUpRequest.setPassword("password123");

        given()
            .contentType(ContentType.JSON)
            .body(signUpRequest)
        .when()
            .post("/api/auth/signup")
        .then()
            .statusCode(201)
            .body(is("User registered successfully"));
    }

    @Test
    @DisplayName("Should fail to register user if username already exists")
    void signUp_Fail_UsernameExists() {
        // User 'admin_test' already exists from setup
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setName("Another Admin");
        signUpRequest.setUsername("admin_test"); // Existing username
        signUpRequest.setEmail("another@example.com");
        signUpRequest.setPassword("password123");

        given()
            .contentType(ContentType.JSON)
            .body(signUpRequest)
        .when()
            .post("/api/auth/signup")
        .then()
            .statusCode(400)
            .body("message", is("Username is already taken!"));
    }

    @Test
    @DisplayName("Should fail to register user if email already exists")
    void signUp_Fail_EmailExists() {
        // User 'admin_test@example.com' already exists from setup
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setName("Another Admin");
        signUpRequest.setUsername("another_admin");
        signUpRequest.setEmail("admin_test@example.com"); // Existing email
        signUpRequest.setPassword("password123");

        given()
            .contentType(ContentType.JSON)
            .body(signUpRequest)
        .when()
            .post("/api/auth/signup")
        .then()
            .statusCode(400)
            .body("message", is("Email Address already in use!"));
    }

    @Test
    @DisplayName("Should authenticate user and return JWT token")
    void signIn_Success() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("admin_test");
        loginRequest.setPassword("admin_pass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/signin")
        .then()
            .statusCode(200)
            .body("accessToken", notNullValue());
    }

    @Test
    @DisplayName("Should fail to authenticate with incorrect password")
    void signIn_Fail_IncorrectPassword() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("admin_test");
        loginRequest.setPassword("wrong_pass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/signin")
        .then()
            .statusCode(401); // Unauthorized due to bad credentials
    }

    @Test
    @DisplayName("Should fail to authenticate with non-existent user")
    void signIn_Fail_NonExistentUser() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("nonexistent");
        loginRequest.setPassword("any_pass");

        given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
        .when()
            .post("/api/auth/signin")
        .then()
            .statusCode(401); // Unauthorized
    }
}
```