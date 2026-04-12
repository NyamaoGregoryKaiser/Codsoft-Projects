```cpp
#ifndef AUTH_MANAGER_H
#define AUTH_MANAGER_H

#include <string>
#include <optional>
#include <bcrypt.h> // Using a hypothetical bcrypt library, replace with actual one (e.g., tiny-json/json.hpp) or similar
#include <random>
#include "../utils/Logger.h"
#include "../utils/ErrorHandler.h"
#include "../database/DatabaseManager.h"
#include "../database/models/User.h"
#include "JWTUtils.h"

namespace Scraper {
namespace Auth {

class AuthManager {
public:
    static AuthManager& getInstance() {
        static AuthManager instance;
        return instance;
    }

    std::optional<std::string> registerUser(const std::string& username, const std::string& email, const std::string& password) {
        if (username.empty() || email.empty() || password.empty()) {
            throw Scraper::Utils::BadRequestException("Username, email, and password cannot be empty.");
        }
        if (password.length() < 8) {
            throw Scraper::Utils::BadRequestException("Password must be at least 8 characters long.");
        }

        // Check if username or email already exists
        if (Scraper::Database::DatabaseManager::getInstance().getUserByUsername(username).has_value()) {
            throw Scraper::Utils::BadRequestException("Username already taken.");
        }
        // Ideally, also check email uniqueness

        try {
            std::string password_hash = hashPassword(password);
            Scraper::Database::Models::User new_user;
            new_user.id = Scraper::Database::DatabaseManager::getInstance().generateUuid();
            new_user.username = username;
            new_user.email = email;
            new_user.password_hash = password_hash;
            new_user.created_at = std::chrono::system_clock::now();
            new_user.updated_at = std::chrono::system_clock::now();

            std::optional<Scraper::Database::Models::User> created_user = Scraper::Database::DatabaseManager::getInstance().createUser(new_user);

            if (created_user) {
                Scraper::Auth::TokenPayload payload{created_user->id, created_user->username};
                return JWTUtils::generateToken(payload);
            }
        } catch (const Scraper::Utils::DatabaseException& e) {
            Scraper::Utils::Logger::get_logger()->error("Database error during registration: {}", e.what());
            throw Scraper::Utils::ScraperException("Registration failed due to database error.");
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Unexpected error during registration: {}", e.what());
            throw Scraper::Utils::ScraperException("Registration failed.");
        }
        return std::nullopt;
    }

    std::optional<std::string> loginUser(const std::string& username, const std::string& password) {
        if (username.empty() || password.empty()) {
            throw Scraper::Utils::BadRequestException("Username and password cannot be empty.");
        }

        try {
            std::optional<Scraper::Database::Models::User> user = Scraper::Database::DatabaseManager::getInstance().getUserByUsername(username);
            if (!user) {
                throw Scraper::Utils::UnauthorizedException("Invalid credentials.");
            }

            if (verifyPassword(password, user->password_hash)) {
                Scraper::Auth::TokenPayload payload{user->id, user->username};
                return JWTUtils::generateToken(payload);
            } else {
                throw Scraper::Utils::UnauthorizedException("Invalid credentials.");
            }
        } catch (const Scraper::Utils::DatabaseException& e) {
            Scraper::Utils::Logger::get_logger()->error("Database error during login: {}", e.what());
            throw Scraper::Utils::ScraperException("Login failed due to database error.");
        }
        catch (const Scraper::Utils::UnauthorizedException&) {
            throw; // Re-throw specific unauthorized exception
        }
        catch (const std::exception& e) {
            Scraper::Utils::Logger::get_logger()->error("Unexpected error during login: {}", e.what());
            throw Scraper::Utils::ScraperException("Login failed.");
        }
        return std::nullopt;
    }

    std::optional<TokenPayload> authenticateToken(const std::string& token) {
        return JWTUtils::verifyToken(token);
    }

private:
    AuthManager() = default;
    AuthManager(const AuthManager&) = delete;
    AuthManager& operator=(const AuthManager&) = delete;

    // Dummy bcrypt implementation for demonstration.
    // In a real project, use a robust library like "bcrypt-cpp" or similar.
    std::string hashPassword(const std::string& password) {
        // Placeholder for bcrypt hashing
        // Actual bcrypt functions take salt and cost factor.
        // For demonstration, we'll simulate a hash.
        std::string salt = "$2a$10$abcdefghijklmnopqrstuu"; // Example salt prefix
        char hashed_password[BCRYPT_HASHSIZE];
        if (bcrypt_hashpw(password.c_str(), salt.c_str(), hashed_password) != 0) {
            throw std::runtime_error("Failed to hash password.");
        }
        Scraper::Utils::Logger::get_logger()->debug("Hashed password (simulated).");
        return std::string(hashed_password);
    }

    bool verifyPassword(const std::string& password, const std::string& hashed_password) {
        // Placeholder for bcrypt verification
        char input_hashed_password[BCRYPT_HASHSIZE];
        if (bcrypt_hashpw(password.c_str(), hashed_password.c_str(), input_hashed_password) != 0) {
            Scraper::Utils::Logger::get_logger()->error("Failed to re-hash password for verification.");
            return false;
        }
        Scraper::Utils::Logger::get_logger()->debug("Verified password (simulated).");
        return std::string(input_hashed_password) == hashed_password;
    }
};

} // namespace Auth
} // namespace Scraper

#endif // AUTH_MANAGER_H
```