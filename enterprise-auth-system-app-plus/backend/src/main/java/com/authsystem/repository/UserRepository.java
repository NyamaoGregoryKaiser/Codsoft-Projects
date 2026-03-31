package com.authsystem.repository;

import com.authsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Provides standard CRUD operations and custom query methods for users.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username or email (case-insensitive search for email).
     *
     * @param username The username to search for.
     * @param email The email to search for.
     * @return An Optional containing the found User, or empty if not found.
     */
    Optional<User> findByUsernameOrEmail(String username, String email);

    /**
     * Finds a user by their email address.
     *
     * @param email The email to search for.
     * @return An Optional containing the found User, or empty if not found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their username.
     *
     * @param username The username to search for.
     * @return An Optional containing the found User, or empty if not found.
     */
    Optional<User> findByUsername(String username);

    /**
     * Checks if a user exists with the given username.
     *
     * @param username The username to check.
     * @return True if a user with the username exists, false otherwise.
     */
    Boolean existsByUsername(String username);

    /**
     * Checks if a user exists with the given email address.
     *
     * @param email The email to check.
     * @return True if a user with the email exists, false otherwise.
     */
    Boolean existsByEmail(String email);
}