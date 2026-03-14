#include "UserService.h"
#include "utils/PasswordHasher.h"
#include "utils/JwtManager.h"

#include <drogon/utils/Utilities.h> // For drogon::utils::get ==>(utc time

UserService* UserService::getInstance() {
    static UserService instance;
    return &instance;
}

UserService::UserService() {
    dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        LOG_FATAL << "Database client not initialized. Check config.json and DB connection.";
    }
}

void UserService::registerUser(const std::string& username,
                              const std::string& email,
                              const std::string& password,
                              AuthCallback callback) {
    std::string hashedPassword = PasswordHasher::hashPassword(password);
    std::string sql = "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, username, email, role, created_at, updated_at";

    dbClient->execSqlAsync(sql,
        [callback, hashedPassword](const drogon::orm::Result& result) {
            if (result.empty()) {
                // This shouldn't happen with RETURNING, indicates a problem
                callback({{}, ""}, "Failed to insert user, no data returned.");
                return;
            }
            User newUser;
            newUser.id = result[0]["id"].as<std::string>();
            newUser.username = result[0]["username"].as<std::string>();
            newUser.email = result[0]["email"].as<std::string>();
            newUser.role = result[0]["role"].as<std::string>();
            newUser.created_at = result[0]["created_at"].as<std::string>();
            newUser.updated_at = result[0]["updated_at"].as<std::string>();
            newUser.password_hash = hashedPassword; // Store hash for consistency, not returned to client

            std::string token = JwtManager::generateToken(newUser.id, newUser.username, newUser.role);
            callback({newUser, token}, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error during user registration: " << e.what();
            callback({{}, ""}, e.what());
        },
        username, email, hashedPassword
    );
}

void UserService::authenticateUser(const std::string& identifier,
                                  const std::string& password,
                                  AuthCallback callback) {
    std::string sql = "SELECT id, username, email, password_hash, role, created_at, updated_at FROM users WHERE username = $1 OR email = $1";

    dbClient->execSqlAsync(sql,
        [callback, password](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback({{}, ""}, "User not found.");
                return;
            }

            User user;
            user.id = result[0]["id"].as<std::string>();
            user.username = result[0]["username"].as<std::string>();
            user.email = result[0]["email"].as<std::string>();
            user.password_hash = result[0]["password_hash"].as<std::string>();
            user.role = result[0]["role"].as<std::string>();
            user.created_at = result[0]["created_at"].as<std::string>();
            user.updated_at = result[0]["updated_at"].as<std::string>();

            if (PasswordHasher::verifyPassword(password, user.password_hash)) {
                std::string token = JwtManager::generateToken(user.id, user.username, user.role);
                callback({user, token}, "");
            } else {
                callback({{}, ""}, "Invalid password.");
            }
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error during user authentication: " << e.what();
            callback({{}, ""}, e.what());
        },
        identifier
    );
}

void UserService::getAllUsers(UserListCallback callback) {
    std::string sql = "SELECT id, username, email, role, created_at, updated_at FROM users";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            std::vector<User> users;
            for (const auto& row : result) {
                User user;
                user.id = row["id"].as<std::string>();
                user.username = row["username"].as<std::string>();
                user.email = row["email"].as<std::string>();
                user.role = row["role"].as<std::string>();
                user.created_at = row["created_at"].as<std::string>();
                user.updated_at = row["updated_at"].as<std::string>();
                users.push_back(user);
            }
            callback(users, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error fetching all users: " << e.what();
            callback({}, e.what());
        }
    );
}

void UserService::getUserById(const std::string& id, UserCallback callback) {
    std::string sql = "SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback(std::nullopt, "");
                return;
            }
            User user;
            user.id = result[0]["id"].as<std::string>();
            user.username = result[0]["username"].as<std::string>();
            user.email = result[0]["email"].as<std::string>();
            user.role = result[0]["role"].as<std::string>();
            user.created_at = result[0]["created_at"].as<std::string>();
            user.updated_at = result[0]["updated_at"].as<std::string>();
            callback(user, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error fetching user by ID: " << e.what();
            callback(std::nullopt, e.what());
        },
        id
    );
}

void UserService::updateUser(const std::string& id, const Json::Value& updates, UserCallback callback) {
    std::string sql = "UPDATE users SET ";
    std::vector<std::string> clauses;
    std::vector<drogon::orm::FieldType> params;
    int param_idx = 1;

    if (updates.isMember("username") && updates["username"].isString()) {
        clauses.push_back("username = $" + std::to_string(param_idx++));
        params.push_back(updates["username"].asString());
    }
    if (updates.isMember("email") && updates["email"].isString()) {
        clauses.push_back("email = $" + std::to_string(param_idx++));
        params.push_back(updates["email"].asString());
    }
    if (updates.isMember("password") && updates["password"].isString()) {
        clauses.push_back("password_hash = $" + std::to_string(param_idx++));
        params.push_back(PasswordHasher::hashPassword(updates["password"].asString()));
    }
    if (updates.isMember("role") && updates["role"].isString()) {
        clauses.push_back("role = $" + std::to_string(param_idx++));
        params.push_back(updates["role"].asString());
    }

    if (clauses.empty()) {
        // No valid fields to update
        callback(std::nullopt, "No valid fields provided for update.");
        return;
    }

    sql += drogon::utils::join(clauses, ", ") + " WHERE id = $" + std::to_string(param_idx++) + " RETURNING id, username, email, role, created_at, updated_at";
    params.push_back(id);

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback(std::nullopt, "Not Found"); // User not found or no rows updated
                return;
            }
            User updatedUser;
            updatedUser.id = result[0]["id"].as<std::string>();
            updatedUser.username = result[0]["username"].as<std::string>();
            updatedUser.email = result[0]["email"].as<std::string>();
            updatedUser.role = result[0]["role"].as<std::string>();
            updatedUser.created_at = result[0]["created_at"].as<std::string>();
            updatedUser.updated_at = result[0]["updated_at"].as<std::string>();
            callback(updatedUser, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error updating user: " << e.what();
            callback(std::nullopt, e.what());
        },
        params
    );
}

void UserService::deleteUser(const std::string& id, GenericCallback callback) {
    std::string sql = "DELETE FROM users WHERE id = $1";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.affectedRows() == 0) {
                callback(false, "Not Found");
                return;
            }
            callback(true, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error deleting user: " << e.what();
            callback(false, e.what());
        },
        id
    );
}