package com.example.chat.repository;

import com.example.chat.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Use real DB (Testcontainers configured globally or by spring profile)
@ActiveProfiles("test") // Ensures test specific configurations are loaded if any
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager; // For direct DB interaction in tests

    @Test
    @DisplayName("Should save a user successfully")
    void shouldSaveUser() {
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password123");
        user.setEmail("test@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getUsername()).isEqualTo("testuser");
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");

        // Verify it's actually in the database
        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should find user by username")
    void shouldFindByUsername() {
        User user = new User();
        user.setUsername("findbyname");
        user.setPassword("pass");
        user.setEmail("findbyname@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        entityManager.persistAndFlush(user); // Persist directly to DB

        Optional<User> foundUser = userRepository.findByUsername("findbyname");

        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("findbyname@example.com");
    }

    @Test
    @DisplayName("Should return empty when user not found by username")
    void shouldReturnEmptyWhenUsernameNotFound() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistent");
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should check if username exists")
    void shouldCheckIfUsernameExists() {
        User user = new User();
        user.setUsername("existuser");
        user.setPassword("pass");
        user.setEmail("exist@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        entityManager.persistAndFlush(user);

        boolean exists = userRepository.existsByUsername("existuser");
        assertThat(exists).isTrue();

        boolean notExists = userRepository.existsByUsername("nonexist");
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfEmailExists() {
        User user = new User();
        user.setUsername("existemail");
        user.setPassword("pass");
        user.setEmail("existemail@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        entityManager.persistAndFlush(user);

        boolean exists = userRepository.existsByEmail("existemail@example.com");
        assertThat(exists).isTrue();

        boolean notExists = userRepository.existsByEmail("nonexist@example.com");
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should delete a user")
    void shouldDeleteUser() {
        User user = new User();
        user.setUsername("todelete");
        user.setPassword("pass");
        user.setEmail("todelete@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User persistedUser = entityManager.persistAndFlush(user);

        userRepository.deleteById(persistedUser.getId());

        Optional<User> foundUser = userRepository.findById(persistedUser.getId());
        assertThat(foundUser).isEmpty();
    }
}