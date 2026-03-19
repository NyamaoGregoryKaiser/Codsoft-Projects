package com.authapp.repository;

import com.authapp.model.Role;
import com.authapp.model.RoleName;
import com.authapp.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Use Testcontainers DB
@DisplayName("UserRepository Integration Tests")
class UserRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "false"); // Disable Flyway for tests, manage schema manually or with hibernate.ddl-auto
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Let Hibernate create schema
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository; // Inject RoleRepository to manage roles in tests

    @Autowired
    private TestEntityManager entityManager; // For managing test data

    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        // Clear data and set up fresh for each test
        userRepository.deleteAll();
        roleRepository.deleteAll();
        entityManager.flush(); // Ensure deletion is committed

        userRole = roleRepository.save(new Role(RoleName.ROLE_USER));
        Role adminRole = roleRepository.save(new Role(RoleName.ROLE_ADMIN));

        testUser = new User("testuser", "test@example.com", "password123");
        testUser.setRoles(new HashSet<>(Collections.singletonList(userRole)));
        userRepository.save(testUser);
        entityManager.clear(); // Detach entities for clean retrieval
    }

    @Test
    void findByUsername_shouldReturnUser() {
        Optional<User> foundUser = userRepository.findByUsername("testuser");
        assertTrue(foundUser.isPresent());
        assertEquals("test@example.com", foundUser.get().getEmail());
        assertTrue(foundUser.get().getRoles().stream().anyMatch(r -> r.getName().equals(RoleName.ROLE_USER)));
    }

    @Test
    void findByUsername_shouldReturnEmptyForNonExistentUser() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistent");
        assertFalse(foundUser.isPresent());
    }

    @Test
    void existsByEmail_shouldReturnTrue() {
        Boolean exists = userRepository.existsByEmail("test@example.com");
        assertTrue(exists);
    }

    @Test
    void existsByEmail_shouldReturnFalse() {
        Boolean exists = userRepository.existsByEmail("other@example.com");
        assertFalse(exists);
    }

    @Test
    void saveUser_shouldPersistAndReturnUser() {
        User newUser = new User("newuser", "new@example.com", "newpass");
        newUser.setRoles(new HashSet<>(Collections.singletonList(userRole)));
        User savedUser = userRepository.save(newUser);

        assertNotNull(savedUser.getId());
        assertEquals("newuser", savedUser.getUsername());
        Optional<User> foundUser = userRepository.findByUsername("newuser");
        assertTrue(foundUser.isPresent());
    }

    @Test
    void deleteUser_shouldRemoveUser() {
        userRepository.deleteById(testUser.getId());
        Optional<User> foundUser = userRepository.findById(testUser.getId());
        assertFalse(foundUser.isPresent());
    }
}
```

**API Tests (`src/test/java/com/authapp/controller/AuthControllerIntegrationTest.java`)**
```java