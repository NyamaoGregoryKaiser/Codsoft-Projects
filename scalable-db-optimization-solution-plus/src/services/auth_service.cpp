```cpp
#include "auth_service.h"
#include "db/repository.h" // For parse_timestamp helper

AuthService::AuthService(std::shared_ptr<PostgresConnection> db_conn, std::shared_ptr<JWTManager> jwt_manager)
    : db_conn_(db_conn), jwt_manager_(jwt_manager) {}

User AuthService::register_user(const std::string& username, const std::string& email, const std::string& password) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        if (find_user_by_username(username).has_value()) {
            throw ConflictException("User with this username already exists.");
        }
        // Basic email validation regex can be added here
        
        std::string hashed_password = hash_password(password);

        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at",
            username, email, hashed_password
        );
        txn.commit();

        if (r.empty()) {
            throw DatabaseException("Failed to register user, no ID returned.");
        }

        long id = r[0]["id"].as<long>();
        auto created_at = parse_timestamp(r[0]["created_at"]);
        auto updated_at = parse_timestamp(r[0]["updated_at"]);

        LOG_INFO("User '{}' registered successfully with ID: {}", username, id);
        return User(id, username, email, hashed_password, created_at, updated_at);

    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error during user registration: {}", e.what());
        throw DatabaseException("Database error during registration.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error during user registration: {}", e.what());
        throw; // Re-throw other exceptions
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::string AuthService::login_user(const std::string& username, const std::string& password) {
    auto user_opt = find_user_by_username(username);
    if (!user_opt.has_value()) {
        throw UnauthorizedException("Invalid username or password.");
    }

    User user = user_opt.value();
    if (!verify_password(password, user.password_hash)) {
        throw UnauthorizedException("Invalid username or password.");
    }

    // Generate JWT token
    std::string token = jwt_manager_->generate_token(user.id, user.username);
    LOG_INFO("User '{}' logged in successfully.", username);
    return token;
}

std::optional<User> AuthService::get_user_by_id(long user_id) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = $1", user_id);
        txn.commit();

        if (r.empty()) {
            return std::nullopt;
        }

        return User(r[0]["id"].as<long>(),
                    r[0]["username"].as<std::string>(),
                    r[0]["email"].as<std::string>(),
                    r[0]["password_hash"].as<std::string>(),
                    parse_timestamp(r[0]["created_at"]),
                    parse_timestamp(r[0]["updated_at"]));
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error fetching user by ID: {}. {}", user_id, e.what());
        throw DatabaseException("Database error fetching user.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error fetching user by ID: {}. {}", user_id, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::optional<User> AuthService::find_user_by_username(const std::string& username) {
    auto conn_ptr = db_conn_->get_connection();
    try {
        pqxx::work txn(*conn_ptr);
        pqxx::result r = txn.exec_params("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = $1", username);
        txn.commit();

        if (r.empty()) {
            return std::nullopt;
        }

        return User(r[0]["id"].as<long>(),
                    r[0]["username"].as<std::string>(),
                    r[0]["email"].as<std::string>(),
                    r[0]["password_hash"].as<std::string>(),
                    parse_timestamp(r[0]["created_at"]),
                    parse_timestamp(r[0]["updated_at"]));
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("SQL Error finding user by username: {}. {}", username, e.what());
        throw DatabaseException("Database error finding user.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error finding user by username: {}. {}", username, e.what());
        throw;
    } finally {
        db_conn_->release_connection(conn_ptr);
    }
}

std::string AuthService::hash_password(const std::string& password) {
    return BCrypt::generateHash(password);
}

bool AuthService::verify_password(const std::string& password, const std::string& hashed_password) {
    return BCrypt::checkpw(password, hashed_password);
}
```