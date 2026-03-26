```cpp
#pragma once

#include <drogon/drogon.h>
#include <string>
#include <optional>
#include "../models/User.h"
#include "../repositories/UserRepository.h"
#include "../utils/JwtManager.h"
#include "../utils/PasswordHasher.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Service for user authentication and registration.
 *
 * This class handles the business logic related to user signup, login,
 * password management, and JWT generation.
 */
class AuthService {
public:
    /**
     * @brief Constructs an AuthService.
     * @param userRepo The UserRepository instance to interact with user data.
     */
    explicit AuthService(UserRepository userRepo = UserRepository());

    /**
     * @brief Registers a new user.
     * @param username The desired username.
     * @param email The user's email address (must be unique).
     * @param password The plaintext password.
     * @return A pair containing the registered User object and a generated JWT.
     * @throws Common::ApiException if email/username is already taken or password is weak.
     */
    drogon::Task<std::pair<User, std::string>> registerUser(const std::string& username,
                                                          const std::string& email,
                                                          const std::string& password);

    /**
     * @brief Authenticates a user and generates a JWT.
     * @param email The user's email address.
     * @param password The plaintext password.
     * @return A pair containing the authenticated User object and a generated JWT.
     * @throws Common::ApiException if credentials are invalid.
     */
    drogon::Task<std::pair<User, std::string>> loginUser(const std::string& email,
                                                         const std::string& password);

    /**
     * @brief Verifies a JWT token.
     * @param token The JWT string.
     * @return A Json::Value containing the decoded claims if valid, empty otherwise.
     */
    Json::Value verifyToken(const std::string& token);

private:
    UserRepository userRepo;

    /**
     * @brief Validates common password strength criteria.
     * @param password The password to validate.
     * @return True if the password is considered strong enough, false otherwise.
     */
    bool isPasswordStrong(const std::string& password) const;
};
```