package com.etms.backend.repository;

import com.etms.backend.model.Role;
import com.etms.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Use H2 in-memory DB for tests
@DisplayName("UserRepository Unit Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll(); // Clear existing data for fresh test runs

        adminUser = User.builder()
                .username("testadmin")
                .email("testadmin@example.com")
                .password("password") // Password doesn't need to be encoded for repository tests
                .role(Role.ADMIN)
                .build();
        userRepository.save(adminUser);

        regularUser = User.builder()
                .username("testuser")
                .email("testuser@example.com")
                .password("password")
                .role(Role.USER)
                .build();
        userRepository.save(regularUser);
    }

    @Test
    @DisplayName("Should find user by username")
    void shouldFindByUsername() {
        Optional<User> foundUser = userRepository.findByUsername("testadmin");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("testadmin@example.com");
    }

    @Test
    @DisplayName("Should not find user by non-existent username")
    void shouldNotFindByNonExistentUsername() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistent");
        assertThat(foundUser).isNotPresent();
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindByEmail() {
        Optional<User> foundUser = userRepository.findByEmail("testuser@example.com");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should exist by username")
    void shouldExistByUsername() {
        boolean exists = userRepository.existsByUsername("testadmin");
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Should not exist by non-existent username")
    void shouldNotExistByNonExistentUsername() {
        boolean exists = userRepository.existsByUsername("nonexistent");
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("Should exist by email")
    void shouldExistByEmail() {
        boolean exists = userRepository.existsByEmail("testuser@example.com");
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Should not exist by non-existent email")
    void shouldNotExistByNonExistentEmail() {
        boolean exists = userRepository.existsByEmail("nonexistent@example.com");
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("Should save a new user")
    void shouldSaveNewUser() {
        User newUser = User.builder()
                .username("newuser")
                .email("newuser@example.com")
                .password("newpassword")
                .role(Role.USER)
                .build();
        User savedUser = userRepository.save(newUser);

        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getId()).isNotNull();
        assertThat(userRepository.count()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should delete a user")
    void shouldDeleteUser() {
        userRepository.delete(adminUser);
        Optional<User> foundUser = userRepository.findByUsername("testadmin");
        assertThat(foundUser).isNotPresent();
        assertThat(userRepository.count()).isEqualTo(1);
    }
}