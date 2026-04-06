#pragma once

#include <string>
#include <optional>
#include <vector>
#include <pqxx/pqxx>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <sstream>

#include "../models/user.h"
#include "../database/db_connection.h"
#include "../utils/logger.h"
#include "../utils/custom_exceptions.h"

namespace Repositories {

class UserRepository {
public:
    UserRepository() = default;

    std::optional<Models::User> findById(const std::string& id) {
        try {
            auto conn = Database::DBConnection::getConnection();
            pqxx::nontransaction w(*conn);
            pqxx::result r = w.exec_params(
                "SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1",
                id
            );

            if (r.empty()) {
                return std::nullopt;
            }

            return rowToUser(r[0]);
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL error in findById: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Database error finding user by ID.");
        } catch (const std::exception& e) {
            LOG_ERROR("Error in findById: {}", e.what());
            throw;
        }
    }

    std::optional<Models::User> findByEmail(const std::string& email) {
        try {
            auto conn = Database::DBConnection::getConnection();
            pqxx::nontransaction w(*conn);
            pqxx::result r = w.exec_params(
                "SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1",
                email
            );

            if (r.empty()) {
                return std::nullopt;
            }

            return rowToUser(r[0]);
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL error in findByEmail: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Database error finding user by email.");
        } catch (const std::exception& e) {
            LOG_ERROR("Error in findByEmail: {}", e.what());
            throw;
        }
    }

    Models::User createUser(const Models::User& user) {
        try {
            auto conn = Database::DBConnection::getConnection();
            pqxx::work w(*conn);

            // Generate UUID for user ID
            std::string new_id = w.exec1("SELECT gen_random_uuid()").at(0).as<std::string>();

            // Get current timestamp for created_at and updated_at
            auto now = std::chrono::system_clock::now();
            std::time_t now_c = std::chrono::system_clock::to_time_t(now);
            std::stringstream ss;
            ss << std::put_time(std::gmtime(&now_c), "%Y-%m-%dT%H:%M:%SZ");
            std::string current_timestamp = ss.str();

            pqxx::result r = w.exec_params(
                "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, password_hash, role, created_at, updated_at",
                new_id,
                user.email,
                user.password_hash,
                Models::userRoleToString(user.role),
                current_timestamp,
                current_timestamp
            );

            w.commit();
            LOG_INFO("User created with ID: {}", new_id);
            return rowToUser(r[0]);
        } catch (const pqxx::unique_violation& e) {
            LOG_WARN("Attempted to create user with existing email: {}", user.email);
            throw CustomExceptions::ConflictException("User with this email already exists.");
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL error in createUser: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Database error creating user.");
        } catch (const std::exception& e) {
            LOG_ERROR("Error in createUser: {}", e.what());
            throw;
        }
    }
    
    // Placeholder for update and delete
    void updateUser(const Models::User& user) {
        try {
            auto conn = Database::DBConnection::getConnection();
            pqxx::work w(*conn);

            auto now = std::chrono::system_clock::now();
            std::time_t now_c = std::chrono::system_clock::to_time_t(now);
            std::stringstream ss;
            ss << std::put_time(std::gmtime(&now_c), "%Y-%m-%dT%H:%M:%SZ");
            std::string current_timestamp = ss.str();

            pqxx::result r = w.exec_params(
                "UPDATE users SET email = $1, password_hash = $2, role = $3, updated_at = $4 WHERE id = $5",
                user.email,
                user.password_hash,
                Models::userRoleToString(user.role),
                current_timestamp,
                user.id
            );

            if (r.affected_rows() == 0) {
                throw CustomExceptions::NotFoundException("User not found for update.");
            }
            w.commit();
            LOG_INFO("User updated with ID: {}", user.id);
        } catch (const pqxx::unique_violation& e) {
            LOG_WARN("Attempted to update user {} with existing email: {}", user.id, user.email);
            throw CustomExceptions::ConflictException("Another user with this email already exists.");
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL error in updateUser: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Database error updating user.");
        } catch (const std::exception& e) {
            LOG_ERROR("Error in updateUser: {}", e.what());
            throw;
        }
    }

    void deleteUser(const std::string& id) {
        try {
            auto conn = Database::DBConnection::getConnection();
            pqxx::work w(*conn);
            pqxx::result r = w.exec_params(
                "DELETE FROM users WHERE id = $1",
                id
            );
            if (r.affected_rows() == 0) {
                throw CustomExceptions::NotFoundException("User not found for deletion.");
            }
            w.commit();
            LOG_INFO("User deleted with ID: {}", id);
        } catch (const pqxx::sql_error& e) {
            LOG_ERROR("SQL error in deleteUser: {}", e.what());
            throw CustomExceptions::InternalServerErrorException("Database error deleting user.");
        } catch (const std::exception& e) {
            LOG_ERROR("Error in deleteUser: {}", e.what());
            throw;
        }
    }

private:
    Models::User rowToUser(const pqxx::row& row) {
        Models::User user;
        user.id = row["id"].as<std::string>();
        user.email = row["email"].as<std::string>();
        user.password_hash = row["password_hash"].as<std::string>();
        user.role = Models::stringToUserRole(row["role"].as<std::string>()).value_or(Models::UserRole::USER); // Default to USER if unknown
        user.created_at = row["created_at"].as<std::string>();
        user.updated_at = row["updated_at"].as<std::string>();
        return user;
    }
};

} // namespace Repositories