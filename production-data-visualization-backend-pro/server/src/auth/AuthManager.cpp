#include "AuthManager.h"
#include "db/DBManager.h"
#include "db/SQLQueries.h"
#include "utils/JWTUtils.h"
#include "utils/Logger.h"
#include "common/Error.h"

// For password hashing, a robust library like bcrypt is crucial.
// For demonstration, we'll use a simple (INSECURE!) SHA256 simulation.
// DO NOT USE THIS IN PRODUCTION.
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>

namespace DataVizPro {

// --- Placeholder for a real password hashing library ---
// In a production environment, you would use bcrypt, Argon2, scrypt, etc.
// Example:
// #include <bcrypt/BCrypt.hpp>
// std::string AuthManager::hashPassword(const std::string& password) {
//     return BCrypt::generateHash(password);
// }
// bool AuthManager::verifyPassword(const std::string& password, const std::string& hash) {
//     return BCrypt::checkPassword(password, hash);
// }
// For now, a simple SHA256 simulation:
std::string AuthManager::_hashPassword(const std::string& password) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, password.c_str(), password.size());
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

bool AuthManager::_verifyPassword(const std::string& password, const std::string& hash) {
    return _hashPassword(password) == hash;
}
// --------------------------------------------------------

AuthManager::AuthManager() {
    // Constructor logic, if any
}

User AuthManager::registerUser(const std::string& username, const std::string& email, const std::string& password) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::work txn(*conn);

    try {
        // Check if username or email already exists
        if (!txn.exec(SQLQueries::SELECT_USER_BY_USERNAME, username).empty()) {
            throw DataVizError(ErrorCode::DUPLICATE_ENTRY, "Username already exists.", "", 409);
        }
        // (Add similar check for email)

        std::string password_hash = _hashPassword(password);

        pqxx::result r = txn.exec_params(SQLQueries::INSERT_USER, username, email, password_hash);
        txn.commit();

        if (r.empty()) {
            throw DataVizError(ErrorCode::DB_ERROR, "Failed to register user: no ID returned", "", 500);
        }

        User new_user;
        new_user.id = r[0][0].as<std::string>();
        new_user.username = username;
        new_user.email = email;
        LOG_INFO("User registered: {}", username);
        return new_user;

    } catch (const pqxx::unique_violation& e) {
        txn.abort();
        throw DataVizError(ErrorCode::DUPLICATE_ENTRY, "Username or email already exists.", e.what(), 409);
    } catch (const pqxx::sql_error& e) {
        txn.abort();
        LOG_ERROR("Database error during user registration: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to register user", e.what(), 500);
    } catch (const DataVizError& e) {
        txn.abort();
        throw; // Re-throw DataVizError
    } catch (const std::exception& e) {
        txn.abort();
        LOG_ERROR("Unexpected error during user registration: {}", e.what());
        throw DataVizError(ErrorCode::UNKNOWN_ERROR, "Failed to register user", e.what(), 500);
    }
}

std::string AuthManager::loginUser(const std::string& username, const std::string& password) {
    auto conn = DBManager::getInstance().getConnection();
    pqxx::nontransaction N(*conn); // Use nontransaction for single read

    try {
        pqxx::result r = N.exec_params(SQLQueries::SELECT_USER_BY_USERNAME, username);

        if (r.empty()) {
            LOG_WARN("Login attempt failed for username '{}': user not found.", username);
            throw DataVizError(ErrorCode::INVALID_CREDENTIALS, "Invalid username or password", "", 401);
        }

        std::string stored_password_hash = r[0]["password_hash"].as<std::string>();

        if (!_verifyPassword(password, stored_password_hash)) {
            LOG_WARN("Login attempt failed for username '{}': incorrect password.", username);
            throw DataVizError(ErrorCode::INVALID_CREDENTIALS, "Invalid username or password", "", 401);
        }

        std::string user_id = r[0]["id"].as<std::string>();
        std::string authenticated_username = r[0]["username"].as<std::string>();

        std::string token = JWTUtils::generateToken(user_id, authenticated_username);
        LOG_INFO("User '{}' logged in successfully.", authenticated_username);
        return token;

    } catch (const DataVizError& e) {
        throw; // Re-throw DataVizError
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("Database error during user login: {}", e.what());
        throw DataVizError(ErrorCode::DB_ERROR, "Failed to login", e.what(), 500);
    } catch (const std::exception& e) {
        LOG_ERROR("Unexpected error during user login: {}", e.what());
        throw DataVizError(ErrorCode::UNKNOWN_ERROR, "Failed to login", e.what(), 500);
    }
}

} // namespace DataVizPro
```