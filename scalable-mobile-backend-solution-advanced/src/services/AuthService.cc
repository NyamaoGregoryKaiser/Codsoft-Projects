```cpp
#include "AuthService.h"
#include <regex>

AuthService::AuthService(UserRepository userRepo) : userRepo(std::move(userRepo)) {}

drogon::Task<std::pair<User, std::string>> AuthService::registerUser(const std::string& username,
                                                                  const std::string& email,
                                                                  const std::string& password) {
    if (!isPasswordStrong(password)) {
        throw Common::ApiException(400, "Password is too weak. It must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.");
    }

    // Check if email or username already exists
    if (co_await userRepo.findByEmail(email)) {
        throw Common::ApiException(409, "User with this email already exists.");
    }
    if (co_await userRepo.findByUsername(username)) {
        throw Common::ApiException(409, "User with this username already exists.");
    }

    std::string hashedPassword = PasswordHasher::hashPassword(password);
    if (hashedPassword.empty()) {
        throw Common::ApiException(500, "Failed to hash password during registration.");
    }

    User newUser;
    newUser.username = username;
    newUser.email = email;
    newUser.password_hash = hashedPassword;

    User registeredUser = co_await userRepo.insert(newUser);

    // Generate JWT
    std::string token = JwtManager::generateToken(registeredUser.id, registeredUser.username, registeredUser.roles);
    if (token.empty()) {
        LOG_ERROR("Failed to generate JWT for new user {}", registeredUser.id);
        // This is a critical failure, but user is already created. Log and throw.
        throw Common::ApiException(500, "User registered, but failed to generate authentication token.");
    }

    LOG_INFO("User {} registered successfully.", registeredUser.email);
    co_return std::make_pair(registeredUser, token);
}

drogon::Task<std::pair<User, std::string>> AuthService::loginUser(const std::string& email,
                                                                 const std::string& password) {
    std::optional<User> userOpt = co_await userRepo.findByEmail(email);
    if (!userOpt) {
        LOG_WARN("Login attempt for non-existent user: {}", email);
        throw Common::ApiException(401, "Invalid credentials.");
    }

    User user = userOpt.value();
    if (!PasswordHasher::verifyPassword(password, user.password_hash)) {
        LOG_WARN("Failed login attempt for user {}: Incorrect password.", email);
        throw Common::ApiException(401, "Invalid credentials.");
    }

    std::string token = JwtManager::generateToken(user.id, user.username, user.roles);
    if (token.empty()) {
        LOG_ERROR("Failed to generate JWT for user {}", user.id);
        throw Common::ApiException(500, "Failed to generate authentication token.");
    }

    LOG_INFO("User {} logged in successfully.", user.email);
    co_return std::make_pair(user, token);
}

Json::Value AuthService::verifyToken(const std::string& token) {
    return JwtManager::verifyToken(token);
}

bool AuthService::isPasswordStrong(const std::string& password) const {
    // Minimum 8 characters
    if (password.length() < 8) return false;
    // At least one uppercase letter
    if (!std::regex_search(password, std::regex("[A-Z]"))) return false;
    // At least one lowercase letter
    if (!std::regex_search(password, std::regex("[a-z]"))) return false;
    // At least one digit
    if (!std::regex_search(password, std::regex("[0-9]"))) return false;
    // At least one special character (not alphanumeric)
    if (!std::regex_search(password, std::regex("[^A-Za-z0-9]"))) return false;
    return true;
}
```