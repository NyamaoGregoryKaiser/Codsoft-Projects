#pragma once

#include <string>
#include <optional>
#include "../repositories/user_repository.h"
#include "../utils/argon2_hasher.h"
#include "../utils/jwt_manager.h"
#include "../utils/custom_exceptions.h"
#include "../utils/logger.h"

namespace Services {

struct AuthTokens {
    std::string accessToken;
    std::string refreshToken;
};

class AuthService {
public:
    AuthService(Repositories::UserRepository& user_repo, Security::Argon2Hasher& hasher, Security::JwtManager& jwt_manager)
        : user_repo_(user_repo), hasher_(hasher), jwt_manager_(jwt_manager) {}

    AuthTokens registerUser(const std::string& email, const std::string& password, const std::string& role_str) {
        if (user_repo_.findByEmail(email)) {
            LOG_WARN("Registration attempt with existing email: {}", email);
            throw CustomExceptions::ConflictException("User with this email already exists.");
        }

        std::string hashed_password = hasher_.hashPassword(password);
        std::optional<Models::UserRole> role = Models::stringToUserRole(role_str);
        if (!role) {
            throw CustomExceptions::BadRequestException("Invalid user role specified.");
        }

        Models::User new_user;
        new_user.email = email;
        new_user.password_hash = hashed_password;
        new_user.role = *role; // Set the role based on input

        Models::User created_user = user_repo_.createUser(new_user);
        
        LOG_INFO("User registered: ID={}, Email={}", created_user.id, created_user.email);
        return generateUserTokens(created_user.id, Models::userRoleToString(created_user.role));
    }

    AuthTokens loginUser(const std::string& email, const std::string& password) {
        std::optional<Models::User> user_opt = user_repo_.findByEmail(email);
        if (!user_opt) {
            LOG_WARN("Login attempt with non-existent email: {}", email);
            throw CustomExceptions::BadCredentialsException();
        }

        Models::User user = *user_opt;
        if (!hasher_.verifyPassword(password, user.password_hash)) {
            LOG_WARN("Login attempt with incorrect password for email: {}", email);
            throw CustomExceptions::BadCredentialsException();
        }

        LOG_INFO("User logged in: ID={}, Email={}", user.id, user.email);
        return generateUserTokens(user.id, Models::userRoleToString(user.role));
    }

    AuthTokens refreshUserTokens(const std::string& refresh_token) {
        Security::TokenClaims claims = jwt_manager_.verifyToken(refresh_token);
        if (claims.type != "refresh") {
            LOG_WARN("Attempted to refresh tokens with invalid token type: {}", claims.type);
            throw CustomExceptions::UnauthorizedException("Invalid token type. Refresh token required.");
        }

        // Re-check if user exists (optional, but good for security)
        std::optional<Models::User> user_opt = user_repo_.findById(claims.userId);
        if (!user_opt) {
            LOG_WARN("Refresh token used by non-existent user ID: {}", claims.userId);
            throw CustomExceptions::UnauthorizedException("User associated with refresh token not found.");
        }

        LOG_INFO("Tokens refreshed for user ID: {}", claims.userId);
        return generateUserTokens(claims.userId, claims.role);
    }

private:
    AuthTokens generateUserTokens(const std::string& userId, const std::string& role) {
        std::string access_token = jwt_manager_.generateAccessToken(userId, role);
        std::string refresh_token = jwt_manager_.generateRefreshToken(userId, role);
        return {access_token, refresh_token};
    }

    Repositories::UserRepository& user_repo_;
    Security::Argon2Hasher& hasher_;
    Security::JwtManager& jwt_manager_;
};

} // namespace Services