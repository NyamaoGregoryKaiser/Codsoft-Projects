```cpp
#include "AuthService.h"
#include "core/database/DatabaseManager.h"
#include "core/models/User.h"
#include "core/utils/Logger.h"
#include "core/utils/JWTManager.h"
#include <stdexcept>
#include <chrono>
#include <iomanip>
#include <sstream>

// For password hashing - using a simple XOR-based hash for demonstration.
// In a real application, use a strong, salted, adaptive hashing algorithm like bcrypt, Argon2, or PBKDF2.
// These typically require external libraries (e.g., libsodium, OpenSSL's EVP_PBE_Cipher functions).
// For the sake of a self-contained C++ project, a basic stub is provided.
namespace {
    std::string simpleXORHash(const std::string& password) {
        std::string hash = "";
        for (char c : password) {
            hash += static_cast<char>(c ^ 0xAA); // Simple XOR with a byte
        }
        return hash;
    }

    bool simpleXORVerify(const std::string& password, const std::string& stored_hash) {
        return simpleXORHash(password) == stored_hash;
    }
}

std::string AuthService::hashPassword(const std::string& password) {
    // In production, use a proper hashing library (e.g., bcrypt, Argon2)
    // Example using a placeholder:
    return simpleXORHash(password);
}

bool AuthService::verifyPassword(const std::string& password, const std::string& stored_hash) {
    // In production, use the same hashing library to verify
    return simpleXORVerify(password, stored_hash);
}

User AuthService::registerUser(const std::string& username, const std::string& email, const std::string& password) {
    soci::session& sql = DatabaseManager::getSession();
    
    // Check if user already exists
    int count = 0;
    try {
        sql << "SELECT COUNT(*) FROM users WHERE email = :email", soci::into(count), soci::use(email);
    } catch (const soci::soci_error& e) {
        Logger::error("Database error checking user existence: {}", e.what());
        throw std::runtime_error("Database error during registration.");
    }

    if (count > 0) {
        throw std::runtime_error("User with this email already exists.");
    }

    std::string hashed_password = hashPassword(password);
    
    // Get current time for created_at and updated_at
    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&tt), "%Y-%m-%dT%H:%M:%SZ"); // ISO 8601 format

    User new_user;
    new_user.username = username;
    new_user.email = email;
    new_user.password_hash = hashed_password;
    new_user.created_at = ss.str();
    new_user.updated_at = ss.str();

    try {
        long long new_user_id;
        sql << "INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (:username, :email, :password_hash, :created_at, :updated_at) RETURNING id",
            soci::use(new_user.username), soci::use(new_user.email), soci::use(new_user.password_hash), soci::use(new_user.created_at), soci::use(new_user.updated_at),
            soci::into(new_user_id);
        new_user.id = new_user_id;
        Logger::info("User registered successfully: ID {}", *new_user.id);
        return new_user;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error during user registration: {}", e.what());
        throw std::runtime_error("Failed to register user. Database error.");
    }
}

std::optional<std::string> AuthService::loginUser(const std::string& email, const std::string& password) {
    soci::session& sql = DatabaseManager::getSession();

    User user;
    std::string stored_hash;
    long long user_id_val;

    try {
        sql << "SELECT id, username, email, password_hash FROM users WHERE email = :email",
            soci::into(user_id_val), soci::into(user.username), soci::into(user.email), soci::into(stored_hash),
            soci::use(email);
        user.id = user_id_val;
        user.password_hash = stored_hash; // Temporarily assign to verify
    } catch (const soci::soci_error& e) {
        if (e.get_error_code() == soci::sqlite3 && std::string(e.what()).find("No data fetched") != std::string::npos) {
            Logger::warn("Login failed: User not found for email {}", email);
            return std::nullopt; // User not found
        }
        Logger::error("Database error during user login: {}", e.what());
        throw std::runtime_error("Database error during login.");
    }

    if (verifyPassword(password, user.password_hash)) {
        Logger::info("User {} logged in successfully.", user.username);
        // Generate JWT token
        return JWTManager::generateToken(*user.id, user.username, user.email);
    } else {
        Logger::warn("Login failed: Incorrect password for email {}", email);
        return std::nullopt; // Incorrect password
    }
}
```