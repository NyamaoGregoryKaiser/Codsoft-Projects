package com.example.authsystem.repository;

import com.example.authsystem.model.Role;
import com.example.authsystem.model.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Don't replace with in-memory DB
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Ensure clean schema for each test run
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TestEntityManager entityManager; // For direct DB operations to set up test data

    private Role userRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        // Ensure roles exist before each test
        userRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.USER).build()));
        adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.ADMIN).build()));
        entityManager.flush(); // Commit roles to DB
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll(); // Clean up users after each test
        // roles are usually static, so no need to delete
    }

    @Test
    void findByEmail_UserExists() {
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .enabled(true)
                .roles(Set.of(userRole))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(user);

        Optional<User> foundUser = userRepository.findByEmail("test@example.com");

        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void findByEmail_UserDoesNotExist() {
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");
        assertThat(foundUser).isNotPresent();
    }

    @Test
    void findByUsername_UserExists() {
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .enabled(true)
                .roles(Set.of(userRole))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(user);

        Optional<User> foundUser = userRepository.findByUsername("testuser");

        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void findByUsername_UserDoesNotExist() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistentuser");
        assertThat(foundUser).isNotPresent();
    }

    @Test
    void existsByEmail_ReturnsTrue() {
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .enabled(true)
                .roles(Set.of(userRole))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(user);

        Boolean exists = userRepository.existsByEmail("test@example.com");
        assertThat(exists).isTrue();
    }

    @Test
    void existsByEmail_ReturnsFalse() {
        Boolean exists = userRepository.existsByEmail("nonexistent@example.com");
        assertThat(exists).isFalse();
    }

    @Test
    void existsByUsername_ReturnsTrue() {
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .enabled(true)
                .roles(Set.of(userRole))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(user);

        Boolean exists = userRepository.existsByUsername("testuser");
        assertThat(exists).isTrue();
    }

    @Test
    void existsByUsername_ReturnsFalse() {
        Boolean exists = userRepository.existsByUsername("nonexistentuser");
        assertThat(exists).isFalse();
    }

    @Test
    void findByPasswordResetToken_TokenExists() {
        User user = User.builder()
                .username("tokenuser")
                .email("token@example.com")
                .password("hashedpassword")
                .enabled(true)
                .passwordResetToken("validToken123")
                .passwordResetTokenExpiry(System.currentTimeMillis() + 600000L) // 10 mins from now
                .roles(Set.of(userRole))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        entityManager.persistAndFlush(user);

        Optional<User> foundUser = userRepository.findByPasswordResetToken("validToken123");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("token@example.com");
    }

    @Test
    void findByPasswordResetToken_TokenDoesNotExist() {
        Optional<User> foundUser = userRepository.findByPasswordResetToken("invalidToken");
        assertThat(foundUser).isNotPresent();
    }
}