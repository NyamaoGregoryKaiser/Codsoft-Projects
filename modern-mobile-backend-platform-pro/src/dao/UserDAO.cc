```cpp
#include "UserDAO.h"
#include "src/utils/Logger.h"
#include <format> // C++20 for std::format

namespace dao
{
    UserDAO::UserDAO() : BaseDAO("users") {}

    std::future<models::User> UserDAO::create(const models::User &user)
    {
        std::string sql = "INSERT INTO users (username, email, password_hash, first_name, last_name) "
                          "VALUES ($1, $2, $3, $4, $5) RETURNING *";
        LOG_DEBUG("SQL: {}", sql);

        auto params = {
            drogon::orm::internal::OptionalType(user.username),
            drogon::orm::internal::OptionalType(user.email),
            drogon::orm::internal::OptionalType(user.passwordHash),
            drogon::orm::internal::OptionalType(user.firstName),
            drogon::orm::internal::OptionalType(user.lastName)
        };

        return dbClient_->execSqlAsync(sql, params)
            .then([](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_ERROR("User creation returned no rows.");
                    throw api::ApiException("Failed to create user", drogon::k500InternalServerError, "USER_CREATION_FAILED");
                }
                models::User createdUser;
                createdUser.fromSqlRow(result[0]);
                LOG_INFO("Created user with ID: {}", createdUser.id);
                return createdUser;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    // Re-throw through handleDbException for specific error mapping
                    throw api::ConflictException(
                        std::format("Username or email already exists."), "USER_ALREADY_EXISTS"
                    );
                }
                catch (...) { throw; }
                return models::User(); // Should not reach here
            });
    }

    std::future<std::optional<models::User>> UserDAO::findById(const std::string &id)
    {
        std::string sql = "SELECT * FROM users WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([](drogon::orm::Result result) -> std::optional<models::User> {
                if (result.empty())
                {
                    LOG_DEBUG("User with ID '{}' not found.", id);
                    return std::nullopt;
                }
                models::User user;
                user.fromSqlRow(result[0]);
                return user;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding user by ID: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::User>(); // Should not reach here
            });
    }

    std::future<std::optional<models::User>> UserDAO::findByUsername(const std::string &username)
    {
        std::string sql = "SELECT * FROM users WHERE username = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, username)
            .then([](drogon::orm::Result result) -> std::optional<models::User> {
                if (result.empty())
                {
                    LOG_DEBUG("User with username '{}' not found.", username);
                    return std::nullopt;
                }
                models::User user;
                user.fromSqlRow(result[0]);
                return user;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding user by username: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::User>();
            });
    }

    std::future<std::optional<models::User>> UserDAO::findByEmail(const std::string &email)
    {
        std::string sql = "SELECT * FROM users WHERE email = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, email)
            .then([](drogon::orm::Result result) -> std::optional<models::User> {
                if (result.empty())
                {
                    LOG_DEBUG("User with email '{}' not found.", email);
                    return std::nullopt;
                }
                models::User user;
                user.fromSqlRow(result[0]);
                return user;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding user by email: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::User>();
            });
    }

    std::future<std::optional<models::User>> UserDAO::findByEmailOrUsername(const std::string &emailOrUsername)
    {
        std::string sql = "SELECT * FROM users WHERE email = $1 OR username = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, emailOrUsername)
            .then([](drogon::orm::Result result) -> std::optional<models::User> {
                if (result.empty())
                {
                    LOG_DEBUG("User with email/username '{}' not found.", emailOrUsername);
                    return std::nullopt;
                }
                models::User user;
                user.fromSqlRow(result[0]);
                return user;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding user by email or username: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::User>();
            });
    }


    std::future<models::User> UserDAO::update(const models::User &user)
    {
        std::string sql = "UPDATE users SET username = $1, email = $2, password_hash = $3, first_name = $4, last_name = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *";
        LOG_DEBUG("SQL: {}", sql);

        auto params = {
            drogon::orm::internal::OptionalType(user.username),
            drogon::orm::internal::OptionalType(user.email),
            drogon::orm::internal::OptionalType(user.passwordHash),
            drogon::orm::internal::OptionalType(user.firstName),
            drogon::orm::internal::OptionalType(user.lastName),
            drogon::orm::internal::OptionalType(user.id)
        };

        return dbClient_->execSqlAsync(sql, params)
            .then([](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_WARN("Update user with ID '{}' affected no rows.", user.id);
                    throw api::NotFoundException(std::format("User with ID '{}' not found for update.", user.id));
                }
                models::User updatedUser;
                updatedUser.fromSqlRow(result[0]);
                LOG_INFO("Updated user with ID: {}", updatedUser.id);
                return updatedUser;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    // Specific error for unique constraint violation
                    if (e.getSqlState() == "23505") { // unique_violation
                        throw api::ConflictException(
                            std::format("Cannot update user: username or email already exists."), "USER_UPDATE_CONFLICT"
                        );
                    }
                    // General DB error
                    throw api::ApiException(std::format("Database error updating user: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return models::User(); // Should not reach here
            });
    }

    std::future<bool> UserDAO::remove(const std::string &id)
    {
        std::string sql = "DELETE FROM users WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([](drogon::orm::Result result) {
                size_t rowsAffected = result.affectedRows();
                if (rowsAffected > 0)
                {
                    LOG_INFO("Deleted user with ID: {}", id);
                    return true;
                }
                LOG_WARN("Delete user with ID '{}' affected no rows (not found).", id);
                return false;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error deleting user: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return false; // Should not reach here
            });
    }

    std::future<std::vector<models::User>> UserDAO::findAll()
    {
        std::string sql = "SELECT * FROM users";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql)
            .then([](drogon::orm::Result result) {
                std::vector<models::User> users;
                for (const auto &row : result)
                {
                    models::User user;
                    user.fromSqlRow(row);
                    users.push_back(user);
                }
                LOG_INFO("Found {} users.", users.size());
                return users;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding all users: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::vector<models::User>(); // Should not reach here
            });
    }

} // namespace dao
```