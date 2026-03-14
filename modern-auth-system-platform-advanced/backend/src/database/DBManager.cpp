#include "DBManager.h"
#include "../logger/Logger.h"
#include <stdexcept>
#include <sstream>

DBManager::DBManager() : conn(nullptr) {}

DBManager::~DBManager() {
    disconnect();
}

DBManager& DBManager::getInstance() {
    static DBManager instance;
    return instance;
}

void DBManager::connect(const std::string& connInfo) {
    if (conn && conn->is_open()) {
        Logger::getLogger()->info("Database already connected.");
        return;
    }
    connectionString = connInfo;
    try {
        conn = std::make_unique<pqxx::connection>(connectionString);
        if (conn->is_open()) {
            Logger::getLogger()->info("Successfully connected to database: {}", conn->dbname());
        } else {
            Logger::getLogger()->error("Failed to connect to database.");
            throw std::runtime_error("Failed to connect to database.");
        }
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->critical("Database connection error: {} - SQL: {}", e.what(), e.query());
        throw std::runtime_error("Database connection error: " + std::string(e.what()));
    } catch (const std::exception& e) {
        Logger::getLogger()->critical("General database error: {}", e.what());
        throw std::runtime_error("General database error: " + std::string(e.what()));
    }
}

void DBManager::disconnect() {
    if (conn && conn->is_open()) {
        conn->disconnect();
        Logger::getLogger()->info("Disconnected from database.");
    }
}

bool DBManager::isConnected() const {
    return conn && conn->is_open();
}

std::optional<User> DBManager::createUser(const std::string& username, const std::string& passwordHash, UserRole role) {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }

    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id;",
            username, passwordHash, userRoleToString(role)
        );
        W.commit();

        if (!R.empty()) {
            int id = R[0]["id"].as<int>();
            Logger::getLogger()->info("User '{}' created with ID {}", username, id);
            return User(id, username, passwordHash, role);
        }
    } catch (const pqxx::unique_violation& e) {
        Logger::getLogger()->warn("Attempted to create duplicate user '{}'. Error: {}", username, e.what());
        return std::nullopt; // Indicate that user already exists (or unique constraint violated)
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error creating user '{}': {} - SQL: {}", username, e.what(), e.query());
        throw;
    }
    return std::nullopt;
}

std::optional<User> DBManager::findUserById(int id) {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }

    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params(
            "SELECT id, username, password_hash, role FROM users WHERE id = $1;",
            id
        );

        if (!R.empty()) {
            return User(
                R[0]["id"].as<int>(),
                R[0]["username"].as<std::string>(),
                R[0]["password_hash"].as<std::string>(),
                stringToUserRole(R[0]["role"].as<std::string>())
            );
        }
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error finding user by ID {}: {} - SQL: {}", id, e.what(), e.query());
        throw;
    }
    return std::nullopt;
}

std::optional<User> DBManager::findUserByUsername(const std::string& username) {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }

    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params(
            "SELECT id, username, password_hash, role FROM users WHERE username = $1;",
            username
        );

        if (!R.empty()) {
            return User(
                R[0]["id"].as<int>(),
                R[0]["username"].as<std::string>(),
                R[0]["password_hash"].as<std::string>(),
                stringToUserRole(R[0]["role"].as<std::string>())
            );
        }
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error finding user by username '{}': {} - SQL: {}", username, e.what(), e.query());
        throw;
    }
    return std::nullopt;
}

bool DBManager::updateUser(const User& user) {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }
    if (!user.getId().has_value()) {
        Logger::getLogger()->error("Cannot update user without an ID.");
        return false;
    }

    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4;",
            user.getUsername(), user.getPasswordHash(), userRoleToString(user.getRole()), user.getId().value()
        );
        W.commit();
        Logger::getLogger()->info("User with ID {} updated.", user.getId().value());
        return R.affected_rows() == 1;
    } catch (const pqxx::unique_violation& e) {
        Logger::getLogger()->warn("Attempted to update user ID {} to duplicate username '{}'. Error: {}", user.getId().value(), user.getUsername(), e.what());
        return false; // Indicate unique constraint violation
    }
    catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error updating user ID {}: {} - SQL: {}", user.getId().value(), e.what(), e.query());
        throw;
    }
    return false;
}

bool DBManager::deleteUser(int id) {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }

    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "DELETE FROM users WHERE id = $1;",
            id
        );
        W.commit();
        Logger::getLogger()->info("User with ID {} deleted.", id);
        return R.affected_rows() == 1;
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error deleting user ID {}: {} - SQL: {}", id, e.what(), e.query());
        throw;
    }
    return false;
}

std::vector<User> DBManager::getAllUsers() {
    if (!conn || !conn->is_open()) {
        throw std::runtime_error("Database not connected.");
    }

    std::vector<User> users;
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec("SELECT id, username, password_hash, role FROM users ORDER BY id;");

        for (const auto& row : R) {
            users.emplace_back(
                row["id"].as<int>(),
                row["username"].as<std::string>(),
                row["password_hash"].as<std::string>(),
                stringToUserRole(row["role"].as<std::string>())
            );
        }
    } catch (const pqxx::sql_error& e) {
        Logger::getLogger()->error("Error getting all users: {} - SQL: {}", e.what(), e.query());
        throw;
    }
    return users;
}