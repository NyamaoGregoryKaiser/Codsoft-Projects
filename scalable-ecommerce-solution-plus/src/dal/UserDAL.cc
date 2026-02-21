```cpp
#include "UserDAL.h"
#include <spdlog/spdlog.h>

namespace ECommerce {
    namespace DAL {

        UserDAL::UserDAL(drogon::orm::DbClientPtr dbClient) : _dbClient(std::move(dbClient)) {}

        Models::User UserDAL::mapRowToUser(const drogon::orm::Row& row) {
            Models::User user;
            user.id = row["id"].as<long>();
            user.username = row["username"].as<std::string>();
            user.email = row["email"].as<std::string>();
            user.password_hash = row["password_hash"].as<std::string>();
            user.created_at = row["created_at"].as<std::string>();
            user.updated_at = row["updated_at"].as<std::string>();
            user.role = row["role"].as<std::string>();
            return user;
        }

        std::future<std::optional<Models::User>> UserDAL::findById(long id) {
            return _dbClient->execSqlAsync("SELECT id, username, email, password_hash, created_at, updated_at, role FROM users WHERE id = $1", id)
                .then([this](const drogon::orm::Result& result) -> std::optional<Models::User> {
                    if (result.empty()) {
                        return std::nullopt;
                    }
                    return mapRowToUser(result[0]);
                })
                .via(_dbClient->get       <drogon::orm::DbClientTask::DbIoThreadPool>()); // Run continuation in DB thread pool
        }

        std::future<std::optional<Models::User>> UserDAL::findByEmail(const std::string& email) {
            return _dbClient->execSqlAsync("SELECT id, username, email, password_hash, created_at, updated_at, role FROM users WHERE email = $1", email)
                .then([this](const drogon::orm::Result& result) -> std::optional<Models::User> {
                    if (result.empty()) {
                        return std::nullopt;
                    }
                    return mapRowToUser(result[0]);
                })
                .via(_dbClient->get       <drogon::orm::DbClientTask::DbIoThreadPool>());
        }

        std::future<Models::User> UserDAL::createUser(const Models::User& user) {
            return _dbClient->execSqlAsync(
                "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, password_hash, created_at, updated_at, role",
                user.username, user.email, user.password_hash, user.role
            )
            .then([this](const drogon::orm::Result& result) {
                if (result.empty()) {
                    throw std::runtime_error("Failed to create user, no rows returned.");
                }
                return mapRowToUser(result[0]);
            })
            .via(_dbClient->get       <drogon::orm::DbClientTask::DbIoThreadPool>());
        }

        std::future<Models::User> UserDAL::updateUser(const Models::User& user) {
            return _dbClient->execSqlAsync(
                "UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, updated_at = NOW() WHERE id = $5 RETURNING id, username, email, password_hash, created_at, updated_at, role",
                user.username, user.email, user.password_hash, user.role, user.id
            )
            .then([this](const drogon::orm::Result& result) {
                if (result.empty()) {
                    throw std::runtime_error("Failed to update user, no rows returned.");
                }
                return mapRowToUser(result[0]);
            })
            .via(_dbClient->get       <drogon::orm::DbClientTask::DbIoThreadPool>());
        }

        std::future<void> UserDAL::deleteUser(long id) {
            return _dbClient->execSqlAsync("DELETE FROM users WHERE id = $1", id)
                .then([](const drogon::orm::Result& result) {
                    if (result.affectedRows() == 0) {
                        throw std::runtime_error("No user found with the given ID to delete.");
                    }
                })
                .via(_dbClient->get       <drogon::orm::DbClientTask::DbIoThreadPool>());
        }
    }
}
```