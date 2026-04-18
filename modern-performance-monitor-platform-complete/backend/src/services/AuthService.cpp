```cpp
#include "AuthService.h"
#include "../exceptions/AppException.h"
#include "../utils/Config.h"

// For password hashing, a real implementation would use a library like libsodium or Argon2/bcrypt
// For this example, we'll use a simple placeholder. DO NOT USE IN PRODUCTION.
#include <crypt.h> // For crypt_r function (Linux specific, requires -lcrypt)
#include <cstring> // For strcmp

AuthService::AuthService() {
    Config::load();
    jwt_secret = Config::get("JWT_SECRET");
    Logger::get_logger()->debug("AuthService initialized with JWT secret.");
}

std::string AuthService::hash_password(const std::string& password) {
    // Placeholder for a strong hashing algorithm like bcrypt or Argon2
    // In a real application, you'd use a robust library like libsodium or a C++ bcrypt wrapper.
    // For demonstration, we'll use crypt_r with a fixed salt (not secure for real use).
    char salt[] = "$2a$10$abcdefghabcdefghabcdefgh./"; // Example bcrypt salt prefix and 22 random chars
    char* hashed_c_str = crypt(password.c_str(), salt); // crypt uses a global buffer, not thread-safe.
                                                        // For thread-safety, use crypt_r if available, or a dedicated library.
    if (hashed_c_str) {
        return std::string(hashed_c_str);
    }
    Logger::get_logger()->error("Failed to hash password.");
    throw AppException(AppException::UNKNOWN_ERROR, "Failed to hash password.");
}

bool AuthService::verify_password(const std::string& password, const std::string& hashed_password) {
    char* hashed_c_str = crypt(password.c_str(), hashed_password.c_str());
    if (hashed_c_str) {
        return strcmp(hashed_c_str, hashed_password.c_str()) == 0;
    }
    return false;
}


std::optional<User> AuthService::get_user_by_username(const std::string& username) {
    auto conn = DBManager::get_instance().get_connection();
    pqxx::work txn(*conn);
    try {
        pqxx::result r = txn.exec_params(
            "SELECT id, username, password_hash, role FROM users WHERE username = $1",
            username
        );
        if (!r.empty()) {
            User user;
            user.id = r[0]["id"].as<int>();
            user.username = r[0]["username"].as<std::string>();
            user.password_hash = r[0]["password_hash"].as<std::string>();
            user.role = r[0]["role"].as<std::string>();
            return user;
        }
        return std::nullopt;
    } catch (const pqxx::sql_error& e) {
        Logger::get_logger()->error("Database error fetching user {}: {}", username, e.what());
        throw AppException(AppException::DATABASE_ERROR, "Database error fetching user.");
    }
}

LoginResponseDTO AuthService::login_user(const LoginRequestDTO& request) {
    auto user_opt = get_user_by_username(request.username);

    if (!user_opt || !verify_password(request.password, user_opt->password_hash)) {
        Logger::get_logger()->warn("Failed login attempt for user: {}", request.username);
        throw AppException(AppException::UNAUTHORIZED, "Invalid username or password.");
    }

    std::string token = generate_token(user_opt.value());
    return {token, user_opt->username, user_opt->role};
}

std::string AuthService::generate_token(const User& user) {
    auto token = jwt::create()
        .set_issuer("perfo-metrics-backend")
        .set_type("JWT")
        .set_id(std::to_string(user.id))
        .set_subject(user.username)
        .set_payload_claim("role", jwt::claim(user.role))
        .set_issued_at(std::chrono::system_clock::now())
        .set_expires_at(std::chrono::system_clock::now() + std::chrono::hours{24}) // 24-hour token
        .sign(jwt::algorithm::hs256{jwt_secret});
    return token;
}

std::optional<User> AuthService::validate_token(const std::string& token) {
    try {
        auto decoded_token = jwt::decode(token);
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{jwt_secret})
            .with_issuer("perfo-metrics-backend");
        verifier.verify(decoded_token);

        User user;
        user.id = std::stoi(decoded_token.get_id());
        user.username = decoded_token.get_subject();
        user.role = decoded_token.get_payload_claim("role").as_string();

        return user;
    } catch (const jwt::verification_error& e) {
        Logger::get_logger()->warn("JWT verification failed: {}", e.what());
        if (e.what() && std::string(e.what()).find("expired") != std::string::npos) {
            throw AppException(AppException::TOKEN_EXPIRED, "Authentication token expired.");
        }
        throw AppException(AppException::TOKEN_INVALID, "Invalid authentication token.");
    } catch (const std::exception& e) {
        Logger::get_logger()->error("Error validating token: {}", e.what());
        throw AppException(AppException::TOKEN_INVALID, "Invalid authentication token.");
    }
    return std::nullopt;
}
```