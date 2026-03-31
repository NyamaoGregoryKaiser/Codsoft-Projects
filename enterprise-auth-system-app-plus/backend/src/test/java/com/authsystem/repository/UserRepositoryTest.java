package com.authsystem.repository;

import com.authsystem.entity.Role;
import com.authsystem.entity.User;
import com.authsystem.util.RoleName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // Use a real DB (Testcontainers for example)
@ActiveProfiles("test") // Use a test profile that points to Testcontainers DB or H2
@DisplayName("UserRepository Integration Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TestEntityManager entityManager; // For managing test data

    private Role userRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Ensure roles exist for setting up users
        roleRepository.deleteAll(); // Clean roles before each test
        userRole = new Role();
        userRole.setName(RoleName.ROLE_USER);
        userRole = entityManager.persistAndFlush(userRole);

        Role adminRole = new Role();
        adminRole.setName(RoleName.ROLE_ADMIN);
        entityManager.persistAndFlush(adminRole);

        userRepository.deleteAll(); // Clean users before each test

        testUser = new User("testuser", "test@example.com", "password123");
        testUser.setRoles(Collections.singleton(userRole));
        testUser.setCreatedBy("system");
        testUser.setUpdatedBy("system");
        entityManager.persistAndFlush(testUser);
        entityManager.clear(); // Detach entities from persistence context
    }

    @Test
    @DisplayName("Should find user by username")
    void shouldFindByUsername() {
        // When
        Optional<User> foundUser = userRepository.findByUsername("testuser");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getUsername()).isEqualTo("testuser");
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindByEmail() {
        // When
        Optional<User> foundUser = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
        assertThat(foundUser.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should find user by username or email")
    void shouldFindByUsernameOrEmail() {
        // When
        Optional<User> foundUserByUsername = userRepository.findByUsernameOrEmail("testuser", "nonexistent@example.com");
        Optional<User> foundUserByEmail = userRepository.findByUsernameOrEmail("nonexistentuser", "test@example.com");

        // Then
        assertThat(foundUserByUsername).isPresent();
        assertThat(foundUserByUsername.get().getUsername()).isEqualTo("testuser");

        assertThat(foundUserByEmail).isPresent();
        assertThat(foundUserByEmail.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should return empty optional if user not found by username")
    void shouldReturnEmptyOptionalWhenUsernameNotFound() {
        // When
        Optional<User> foundUser = userRepository.findByUsername("nonexistent");

        // Then
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should return empty optional if user not found by email")
    void shouldReturnEmptyOptionalWhenEmailNotFound() {
        // When
        Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");

        // Then
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should return empty optional if user not found by username or email")
    void shouldReturnEmptyOptionalWhenUsernameOrEmailNotFound() {
        // When
        Optional<User> foundUser = userRepository.findByUsernameOrEmail("nonexistent", "nonexistent@example.com");

        // Then
        assertThat(foundUser).isEmpty();
    }

    @Test
    @DisplayName("Should check if username exists")
    void shouldExistByUsername() {
        // When
        Boolean exists = userRepository.existsByUsername("testuser");
        Boolean notExists = userRepository.existsByUsername("nonexistent");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldExistByEmail() {
        // When
        Boolean exists = userRepository.existsByEmail("test@example.com");
        Boolean notExists = userRepository.existsByEmail("nonexistent@example.com");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should save a new user")
    void shouldSaveNewUser() {
        // Given
        User newUser = new User("newuser", "new@example.com", "newpassword");
        newUser.setRoles(Collections.singleton(userRole));
        newUser.setCreatedBy("system");
        newUser.setUpdatedBy("system");

        // When
        User savedUser = userRepository.save(newUser);
        entityManager.flush(); // Ensure data is written to DB

        // Then
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getUsername()).isEqualTo("newuser");

        Optional<User> found = userRepository.findById(savedUser.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getRoles()).hasSize(1);
        assertThat(found.get().getRoles().iterator().next().getName()).isEqualTo(RoleName.ROLE_USER);
    }

    @Test
    @DisplayName("Should update an existing user")
    void shouldUpdateExistingUser() {
        // Given
        User existingUser = userRepository.findByUsername("testuser").get();
        existingUser.setEmail("updated@example.com");
        existingUser.setUpdatedBy("testuser");

        // When
        User updatedUser = userRepository.save(existingUser);
        entityManager.flush();
        entityManager.clear();

        // Then
        Optional<User> found = userRepository.findById(existingUser.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("updated@example.com");
        assertThat(found.get().getUpdatedBy()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should delete a user")
    void shouldDeleteUser() {
        // Given
        Long userId = testUser.getId();

        // When
        userRepository.deleteById(userId);
        entityManager.flush();
        entityManager.clear();

        // Then
        Optional<User> found = userRepository.findById(userId);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("Should retrieve roles for a user")
    void shouldRetrieveRolesForUser() {
        // When
        Optional<User> foundUser = userRepository.findByUsername("testuser");

        // Then
        assertThat(foundUser).isPresent();
        User user = foundUser.get();
        Set<Role> roles = user.getRoles();
        assertThat(roles).hasSize(1);
        assertThat(roles.iterator().next().getName()).isEqualTo(RoleName.ROLE_USER);
    }
}
```

#### `backend/src/test/java/com/authsystem/service/AuthServiceTest.java` (Unit Test)
```java