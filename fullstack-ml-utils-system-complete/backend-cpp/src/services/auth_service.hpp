#ifndef ML_UTILITIES_SYSTEM_AUTH_SERVICE_HPP
#define ML_UTILITIES_SYSTEM_AUTH_SERVICE_HPP

#include <string>
#include <memory>
#include <stdexcept>
#include <vector> // For bcrypt mock
#include "../repositories/user_repository.hpp"
#include "../models/user.hpp"
#include "../utils/jwt_manager.hpp"
#include "../utils/logger.hpp"
#include "../common/constants.hpp"

// Placeholder for bcrypt hashing library. In a real project, use a robust library like `bcrypt-cpp`.
namespace BCrypt {
    // Mock for hashing a password
    std::string generateHash(const std::string& password, int rounds = 10) {
        // In real bcrypt, this generates a salted hash.
        // For demonstration, we'll just prepend a prefix and the rounds.
        return "$2a$" + std::to_string(rounds) + "$SALT_PREFIX_MOCK_XYZ" + password + "_HASH";
    }

    // Mock for verifying a password against a hash
    bool validatePassword(const std::string& password, const std::string& hash) {
        // In real bcrypt, this re-hashes the password with the salt from the hash
        // and compares the result.
        // Here, we just check if a simple transformation of password matches.
        // This is HIGHLY INSECURE and for demonstration purposes only.
        return generateHash(password) == hash;
    }
}

/**
 * @brief Service layer for user authentication and authorization.
 * Handles user registration, login, and token generation.
 */
class AuthService {
private:
    std::shared_ptr<UserRepository> user_repository;

public:
    /**
     * @brief Constructs an AuthService.
     * @param user_repo Shared pointer to the UserRepository.
     */
    explicit AuthService(std::shared_ptr<UserRepository> user_repo) : user_repository(std::move(user_repo)) {
        if (!user_repository) {
            LOG_CRITICAL("AuthService initialized with a null UserRepository.");
            throw std::runtime_error("UserRepository cannot be null.");
        }
        LOG_DEBUG("AuthService initialized.");
    }

    /**
     * @brief Registers a new user.
     * @param email The user's email.
     * @param password The user's plain-text password.
     * @param role The user's role (defaults to "user").
     * @return The created User object.
     * @throws std::runtime_error if email already exists or a database error occurs.
     */
    User registerUser(const std::string& email, const std::string& password, const std::string& role = Constants::ROLE_USER) {
        if (user_repository->findByEmail(email)) {
            LOG_WARN("Registration attempt with existing email: {}", email);
            throw std::runtime_error(Constants::ERR_EMAIL_EXISTS);
        }

        std::string password_hash = BCrypt::generateHash(password); // Hash the password
        User new_user{0, email, password_hash, role, {}, {}}; // ID and timestamps will be set by repo

        try {
            User created_user = user_repository->createUser(new_user);
            LOG_INFO("User registered successfully: {}", created_user.email);
            return created_user;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to register user {}: {}", email, e.what());
            throw; // Re-throw to be caught by error middleware
        }
    }

    /**
     * @brief Authenticates a user and generates a JWT token.
     * @param email The user's email.
     * @param password The user's plain-text password.
     * @return A JWT token string if authentication is successful.
     * @throws std::runtime_error if authentication fails (invalid credentials).
     */
    std::string loginUser(const std::string& email, const std::string& password) {
        std::optional<User> user_opt = user_repository->findByEmail(email);

        if (!user_opt || !BCrypt::validatePassword(password, user_opt->password_hash)) {
            LOG_WARN("Failed login attempt for email: {}", email);
            throw std::runtime_error(Constants::ERR_INVALID_CREDENTIALS);
        }

        User user = *user_opt;
        std::string token = JWTManager::createToken(user.id, user.role);
        LOG_INFO("User {} logged in successfully. Token generated.", user.email);
        return token;
    }
};

#endif // ML_UTILITIES_SYSTEM_AUTH_SERVICE_HPP
```