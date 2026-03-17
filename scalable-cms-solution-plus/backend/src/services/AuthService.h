#pragma once

#include <string>
#include <optional>
#include <utility> // For std::pair
#include "models/User.h" // Assuming User model path
#include "common/Enums.h"

// Define a struct for login response, containing access and refresh tokens
struct LoginResponse {
    std::string userId;
    std::string accessToken;
    std::string refreshToken;
    cms::UserRole role;
};

class AuthService {
public:
    static AuthService& instance();

    // Authenticates a user and generates tokens.
    // Returns LoginResponse on success, std::nullopt on failure.
    std::optional<LoginResponse> loginUser(const std::string& email, const std::string& password);

    // Registers a new user.
    // Returns the new User object on success, std::nullopt on failure (e.g., user already exists).
    std::optional<drogon_model::cms_system::User> registerUser(const std::string& email,
                                                                const std::string& password,
                                                                cms::UserRole role = cms::UserRole::USER);

    // Refreshes access token using a refresh token.
    // Returns new access token and new refresh token on success, std::nullopt on failure.
    std::optional<LoginResponse> refreshTokens(const std::string& refreshToken);

    // Marks an access token as invalid (logout).
    void logoutUser(const std::string& accessToken, const std::string& refreshToken);

private:
    AuthService();
    AuthService(const AuthService&) = delete;
    AuthService& operator=(const AuthService&) = delete;
};
```