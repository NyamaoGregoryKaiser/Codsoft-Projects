```cpp
#include "user_service.hpp"
#include "../../utils/logger.hpp"
#include <stdexcept>
#include <cryptopp/sha.h> // Example for hashing, in real project use a proper password hashing lib (Argon2, BCrypt)
#include <cryptopp/hex.h>

namespace Zenith {
namespace Services {

// --- Mock/Example Password Hashing (Replace with Argon2/BCrypt in production!) ---
namespace Auth {
    std::string hashPassword(const std::string& password) {
        // In a real application, use a strong KDF like Argon2 or scrypt.
        // This is a *mock* for demonstration purposes and NOT secure.
        CryptoPP::SHA256 hash;
        std::string digest;
        CryptoPP::StringSource s(password, true,
            new CryptoPP::HashFilter(hash,
                new CryptoPP::HexEncoder(
                    new CryptoPP::StringSink(digest)
                ) // HexEncoder
            ) // HashFilter
        ); // StringSource
        LOG_WARN("Using SHA256 for password hashing - NOT PRODUCTION SAFE. Replace with Argon2/BCrypt.");
        return digest;
    }

    bool verifyPassword(const std::string& password, const std::string& hash) {
        return hashPassword(password) == hash;
    }
}
// ---------------------------------------------------------------------------------

UserService::UserService(Database::UserRepository& repo) : userRepo_(repo) {}

std::optional<Models::User> UserService::getUserById(long id) {
    return userRepo_.findById(id);
}

std::optional<Models::User> UserService::getUserByEmail(const std::string& email) {
    return userRepo_.findByEmail(email);
}

std::optional<Models::User> UserService::getUserByUsername(const std::string& username) {
    return userRepo_.findByUsername(username);
}

std::vector<Models::User> UserService::getAllUsers() {
    return userRepo_.findAll();
}

long UserService::createUser(const std::string& username, const std::string& email, const std::string& password,
                             const std::string& fullName, const std::string& address, const std::string& phoneNumber,
                             const std::string& role) {
    if (userRepo_.findByEmail(email).has_value()) {
        throw std::runtime_error("User with this email already exists.");
    }
    if (userRepo_.findByUsername(username).has_value()) {
        throw std::runtime_error("User with this username already exists.");
    }

    Models::User newUser;
    newUser.username = username;
    newUser.email = email;
    newUser.password_hash = Auth::hashPassword(password);
    newUser.full_name = fullName;
    newUser.address = address;
    newUser.phone_number = phoneNumber;
    newUser.role = role.empty() ? "customer" : role; // Default role

    try {
        return userRepo_.create(newUser);
    } catch (const pqxx::unique_violation& e) {
        LOG_WARN("Attempted to create user with duplicate unique field: {0}", e.what());
        throw std::runtime_error("A user with the provided email or username already exists.");
    } catch (const std::exception& e) {
        LOG_ERROR("Failed to create user: {0}", e.what());
        throw;
    }
}

bool UserService::updateUser(long id, const std::string& username, const std::string& email,
                            const std::string& password_hash, const std::string& fullName,
                            const std::string& address, const std::string& phoneNumber,
                            const std::string& role) {
    auto existingUser = userRepo_.findById(id);
    if (!existingUser.has_value()) {
        throw std::runtime_error("User not found.");
    }

    // Check for unique constraint violations if email/username changed
    if (existingUser->email != email) {
        if (userRepo_.findByEmail(email).has_value()) {
            throw std::runtime_error("Another user with this email already exists.");
        }
    }
    if (existingUser->username != username) {
        if (userRepo_.findByUsername(username).has_value()) {
            throw std::runtime_error("Another user with this username already exists.");
        }
    }

    Models::User userToUpdate = existingUser.value();
    userToUpdate.username = username;
    userToUpdate.email = email;
    userToUpdate.password_hash = password_hash; // This assumes hash is passed. For password change, new password would be hashed.
    userToUpdate.full_name = fullName;
    userToUpdate.address = address;
    userToUpdate.phone_number = phoneNumber;
    userToUpdate.role = role;

    try {
        return userRepo_.update(userToUpdate);
    } catch (const std::exception& e) {
        LOG_ERROR("Failed to update user {0}: {1}", id, e.what());
        throw;
    }
}

bool UserService::deleteUser(long id) {
    if (!userRepo_.findById(id).has_value()) {
        return false; // User not found, so nothing to delete
    }
    try {
        return userRepo_.deleteById(id);
    } catch (const std::exception& e) {
        LOG_ERROR("Failed to delete user {0}: {1}", id, e.what());
        throw;
    }
}

std::optional<Models::User> UserService::authenticateUser(const std::string& email, const std::string& password) {
    auto user = userRepo_.findByEmail(email);
    if (user && Auth::verifyPassword(password, user->password_hash)) {
        return user;
    }
    return std::nullopt;
}

} // namespace Services
} // namespace Zenith
```