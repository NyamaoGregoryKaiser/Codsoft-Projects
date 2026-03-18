#include "UserService.h"
#include "database/DatabaseManager.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"
// #include <argon2.h> // For production-grade password hashing

std::string UserService::hashPassword(const std::string& password) const {
    // In a production application, use a strong password hashing library like Argon2 or bcrypt.
    // Example with Argon2 (requires linking to argon2 library):
    // const uint32_t t_cost = 2;       // 2 iterations
    // const uint32_t m_cost = (1<<16); // 65536 kibibytes
    // const uint32_t parallelism = 1;  // 1 thread
    // const size_t hash_len = 32;      // 32 bytes hash
    // const size_t salt_len = 16;      // 16 bytes salt
    // unsigned char hash[hash_len];
    // unsigned char salt[salt_len];
    // std::random_device rd;
    // std::mt19937 gen(rd());
    // for(size_t i=0; i<salt_len; ++i) salt[i] = gen() % 256;
    // int rc = argon2i_hash_raw(t_cost, m_cost, parallelism, password.data(), password.length(),
    //                         salt, salt_len, hash, hash_len);
    // if (rc != ARGON2_OK) { /* handle error */ }
    // return convert_hash_to_string(hash); // Convert hash bytes to string (e.g., base64)

    // For this example, we use a simple mock hash for demonstration purposes.
    // DO NOT USE THIS IN PRODUCTION!
    return "mock_hash_" + password;
}

bool UserService::verifyPassword(const std::string& password, const std::string& hashed_password) const {
    // In production, use the same hashing library to verify
    // Example with Argon2:
    // return argon2i_verify_raw(t_cost, m_cost, parallelism, password.data(), password.length(),
    //                           salt, salt_len, hash, hash_len) == ARGON2_OK;

    // Mock verification
    return hashPassword(password) == hashed_password;
}

User UserService::createUser(const std::string& username, const std::string& email, const std::string& password) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();

    // Check if username or email already exists
    try {
        if (getUserByEmail(email).has_value()) {
            throw BadRequestError("User with this email already exists.");
        }
        // In a real app, also check username
    } catch (const NotFoundError&) {
        // This is fine, email not found
    }

    std::string hashed_password = hashPassword(password);
    User new_user;
    new_user.id = UUID::generate_uuid_v4();
    new_user.username = username;
    new_user.email = email;
    new_user.password_hash = hashed_password;

    try {
        db_manager.getDb() << "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?);"
            << new_user.id
            << new_user.username
            << new_user.email
            << new_user.password_hash;

        spdlog::info("User created: {}", new_user.email);
        return new_user;
    } catch (const sqlite::sqlite_exception& e) {
        spdlog::error("SQLite error creating user: {}", e.what());
        if (std::string(e.what()).find("UNIQUE constraint failed") != std::string::npos) {
            throw BadRequestError("User with this email or username already exists.");
        }
        throw InternalServerError("Failed to create user.");
    }
}

std::optional<User> UserService::getUserByEmail(const std::string& email) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    std::optional<User> user_opt;
    try {
        db_manager.getDb() << "SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = ?;"
            << email
            >> [&](std::string id, std::string username, std::string email_str, std::string password_hash, std::string created_at, std::string updated_at) {
                user_opt = User{id, username, email_str, password_hash, created_at, updated_at};
            };
    } catch (const sqlite::sqlite_exception& e) {
        if (e.get_sqlite_code() == SQLITE_NOTFOUND) {
            return std::nullopt; // No user found
        }
        spdlog::error("SQLite error getting user by email: {}", e.what());
        throw InternalServerError("Failed to retrieve user by email.");
    }
    return user_opt;
}

std::optional<User> UserService::getUserById(const std::string& id) {
    DatabaseManager& db_manager = DatabaseManager::getInstance();
    std::optional<User> user_opt;
    try {
        db_manager.getDb() << "SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = ?;"
            << id
            >> [&](std::string user_id, std::string username, std::string email_str, std::string password_hash, std::string created_at, std::string updated_at) {
                user_opt = User{user_id, username, email_str, password_hash, created_at, updated_at};
            };
    } catch (const sqlite::sqlite_exception& e) {
        if (e.get_sqlite_code() == SQLITE_NOTFOUND) {
            return std::nullopt; // No user found
        }
        spdlog::error("SQLite error getting user by ID: {}", e.what());
        throw InternalServerError("Failed to retrieve user by ID.");
    }
    return user_opt;
}
```