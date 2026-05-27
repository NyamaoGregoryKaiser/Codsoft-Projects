#ifndef ML_UTILITIES_SYSTEM_USER_REPOSITORY_HPP
#define ML_UTILITIES_SYSTEM_USER_REPOSITORY_HPP

#include <string>
#include <vector>
#include <optional>
#include <memory>
#include <chrono>
#include <pqxx/pqxx>
#include "../models/user.hpp"
#include "db_connection.hpp"
#include "../utils/logger.hpp"

/**
 * @brief Repository for User data, handling CRUD operations with the database.
 */
class UserRepository {
private:
    std::shared_ptr<DBConnectionPool> db_pool;

public:
    /**
     * @brief Constructs a UserRepository with a database connection pool.
     * @param pool Shared pointer to the DBConnectionPool.
     */
    explicit UserRepository(std::shared_ptr<DBConnectionPool> pool) : db_pool(std::move(pool)) {
        if (!db_pool) {
            LOG_CRITICAL("UserRepository initialized with a null DBConnectionPool.");
            throw std::runtime_error("DBConnectionPool cannot be null.");
        }
        LOG_DEBUG("UserRepository initialized.");
    }

    /**
     * @brief Finds a user by their ID.
     * @param id The ID of the user to find.
     * @return An `std::optional<User>` containing the user if found, `std::nullopt` otherwise.
     */
    std::optional<User> findById(int id) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1",
                id
            );

            if (r.empty()) {
                LOG_DEBUG("User with ID {} not found.", id);
                return std::nullopt;
            }

            const auto& row = r[0];
            return User{
                row["id"].as<int>(),
                row["email"].as<std::string>(),
                row["password_hash"].as<std::string>(),
                row["role"].as<std::string>(),
                std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>()),
                std::chrono::system_clock::from_time_t(row["updated_at"].as<std::time_t>())
            };
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding user by ID {}: {}. Query: {}", id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding user by ID {}: {}", id, e.what());
            throw;
        }
    }

    /**
     * @brief Finds a user by their email.
     * @param email The email of the user to find.
     * @return An `std::optional<User>` containing the user if found, `std::nullopt` otherwise.
     */
    std::optional<User> findByEmail(const std::string& email) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1",
                email
            );

            if (r.empty()) {
                LOG_DEBUG("User with email '{}' not found.", email);
                return std::nullopt;
            }

            const auto& row = r[0];
            return User{
                row["id"].as<int>(),
                row["email"].as<std::string>(),
                row["password_hash"].as<std::string>(),
                row["role"].as<std::string>(),
                std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>()),
                std::chrono::system_clock::from_time_t(row["updated_at"].as<std::time_t>())
            };
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error finding user by email '{}': {}. Query: {}", email, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error finding user by email '{}': {}", email, e.what());
            throw;
        }
    }

    /**
     * @brief Creates a new user in the database.
     * @param user A User object containing the new user's data (ID is ignored).
     * @return The created User object with its assigned ID and timestamps.
     * @throws pqxx::sql_error if a database error occurs (e.g., duplicate email).
     */
    User createUser(const User& user) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "INSERT INTO users (email, password_hash, role, created_at, updated_at) "
                "VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, created_at, updated_at",
                user.email, user.password_hash, user.role
            );
            txn.commit();

            const auto& row = r[0];
            User created_user = user;
            created_user.id = row["id"].as<int>();
            created_user.created_at = std::chrono::system_clock::from_time_t(row["created_at"].as<std::time_t>());
            created_user.updated_at = std::chrono::system_clock::from_time_t(row["updated_at"].as<std::time_t>());
            LOG_INFO("User '{}' created with ID {}.", created_user.email, created_user.id);
            return created_user;
        } catch (const pqxx::unique_violation& e) {
            LOG_WARN("Attempted to create user with duplicate email '{}': {}", user.email, e.what());
            throw std::runtime_error("Email already exists."); // Specific error for duplicate
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error creating user '{}': {}. Query: {}", user.email, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error creating user '{}': {}", user.email, e.what());
            throw;
        }
    }

    /**
     * @brief Updates an existing user in the database.
     * Only updates email, password_hash, and role.
     * @param user A User object with the updated data. The `id` field must be set.
     * @return True if the user was updated, false if not found.
     * @throws pqxx::sql_error if a database error occurs.
     */
    bool updateUser(const User& user) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params(
                "UPDATE users SET email = $1, password_hash = $2, role = $3, updated_at = NOW() WHERE id = $4",
                user.email, user.password_hash, user.role, user.id
            );
            txn.commit();
            if (r.affected_rows() > 0) {
                LOG_INFO("User with ID {} updated.", user.id);
                return true;
            }
            LOG_DEBUG("User with ID {} not found for update.", user.id);
            return false;
        } catch (const pqxx::unique_violation& e) {
            LOG_WARN("Attempted to update user {} with duplicate email '{}': {}", user.id, user.email, e.what());
            throw std::runtime_error("Email already exists.");
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error updating user {}: {}. Query: {}", user.id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error updating user {}: {}", user.id, e.what());
            throw;
        }
    }

    /**
     * @brief Deletes a user from the database by ID.
     * @param id The ID of the user to delete.
     * @return True if the user was deleted, false if not found.
     * @throws pqxx::sql_error if a database error occurs.
     */
    bool deleteUser(int id) {
        try {
            ScopedConnection scoped_conn(db_pool.get());
            pqxx::work txn(scoped_conn.get());
            pqxx::result r = txn.exec_params("DELETE FROM users WHERE id = $1", id);
            txn.commit();
            if (r.affected_rows() > 0) {
                LOG_INFO("User with ID {} deleted.", id);
                return true;
            }
            LOG_DEBUG("User with ID {} not found for deletion.", id);
            return false;
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL Error deleting user {}: {}. Query: {}", id, e.what(), e.query());
            throw;
        } catch (const std::exception& e) {
            LOG_ERROR("Error deleting user {}: {}", id, e.what());
            throw;
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_USER_REPOSITORY_HPP
```