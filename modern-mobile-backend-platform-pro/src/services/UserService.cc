```cpp
#include "UserService.h"
#include "src/utils/PasswordUtils.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <format> // C++20 for std::format

namespace services
{
    UserService::UserService(std::shared_ptr<dao::UserDAO> userDAO)
        : userDAO_(std::move(userDAO))
    {
        LOG_INFO("UserService initialized.");
    }

    std::future<models::User> UserService::getUserById(const std::string &userId)
    {
        return userDAO_->findById(userId)
            .then([userId](std::optional<models::User> userOpt) {
                if (!userOpt)
                {
                    LOG_WARN("User with ID '{}' not found.", userId);
                    throw api::NotFoundException(std::format("User with ID '{}' not found.", userId), "USER_NOT_FOUND");
                }
                userOpt->passwordHash = ""; // Clear sensitive data
                LOG_INFO("Retrieved user with ID: {}", userId);
                return *userOpt;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving user by ID: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve user: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_USER_FAILED");
                }
                return models::User();
            });
    }

    std::future<models::User> UserService::updateUser(const std::string &userId, const models::UpdateUserRequest &request)
    {
        if (request.isEmpty()) {
            throw api::BadRequestException("No update data provided.", "NO_UPDATE_DATA");
        }

        return userDAO_->findById(userId)
            .then([this, userId, request](std::optional<models::User> userOpt) {
                if (!userOpt)
                {
                    LOG_WARN("Update attempt for user ID '{}': User not found.", userId);
                    throw api::NotFoundException(std::format("User with ID '{}' not found for update.", userId), "USER_NOT_FOUND");
                }

                models::User user = *userOpt;
                bool changed = false;

                if (request.username && user.username != *request.username) {
                    // Check for username conflict if changing
                    auto existingUser = userDAO_->findByUsername(*request.username).get();
                    if (existingUser && existingUser->id != userId) {
                        throw api::ConflictException(std::format("Username '{}' already taken.", *request.username), "USERNAME_ALREADY_EXISTS");
                    }
                    user.username = *request.username;
                    changed = true;
                }
                if (request.email && user.email != *request.email) {
                    // Check for email conflict if changing
                    auto existingUser = userDAO_->findByEmail(*request.email).get();
                    if (existingUser && existingUser->id != userId) {
                        throw api::ConflictException(std::format("Email '{}' already taken.", *request.email), "EMAIL_ALREADY_EXISTS");
                    }
                    user.email = *request.email;
                    changed = true;
                }
                if (request.firstName && user.firstName != *request.firstName) {
                    user.firstName = *request.firstName;
                    changed = true;
                }
                if (request.lastName && user.lastName != *request.lastName) {
                    user.lastName = *request.lastName;
                    changed = true;
                }
                if (request.password && !request.password->empty()) {
                    user.passwordHash = utils::PasswordUtils::hashPassword(*request.password);
                    changed = true;
                }

                if (!changed) {
                    LOG_INFO("No changes detected for user ID '{}'. Returning current profile.", userId);
                    user.passwordHash = "";
                    return std::future<models::User>(std::async(std::launch::deferred, [user](){ return user; }));
                }

                return userDAO_->update(user);
            })
            .then([](models::User updatedUser) {
                updatedUser.passwordHash = ""; // Clear sensitive data
                LOG_INFO("User with ID '{}' updated successfully.", updatedUser.id);
                return updatedUser;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error updating user: {}", e.what());
                    throw api::ApiException(std::format("Failed to update user: {}", e.what()), drogon::k500InternalServerError, "UPDATE_USER_FAILED");
                }
                return models::User();
            });
    }

    std::future<bool> UserService::deleteUser(const std::string &userId)
    {
        return userDAO_->remove(userId)
            .then([userId](bool deleted) {
                if (!deleted)
                {
                    LOG_WARN("Delete attempt for user ID '{}': User not found.", userId);
                    throw api::NotFoundException(std::format("User with ID '{}' not found for deletion.", userId), "USER_NOT_FOUND");
                }
                LOG_INFO("User with ID '{}' deleted successfully.", userId);
                return true;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error deleting user: {}", e.what());
                    throw api::ApiException(std::format("Failed to delete user: {}", e.what()), drogon::k500InternalServerError, "DELETE_USER_FAILED");
                }
                return false;
            });
    }

    std::future<std::vector<models::User>> UserService::getAllUsers()
    {
        return userDAO_->findAll()
            .then([](std::vector<models::User> users) {
                for (auto &user : users)
                {
                    user.passwordHash = ""; // Clear sensitive data
                }
                LOG_INFO("Retrieved {} all users.", users.size());
                return users;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving all users: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve all users: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_ALL_USERS_FAILED");
                }
                return std::vector<models::User>();
            });
    }

} // namespace services
```