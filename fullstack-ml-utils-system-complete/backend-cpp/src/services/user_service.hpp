#ifndef ML_UTILITIES_SYSTEM_USER_SERVICE_HPP
#define ML_UTILITIES_SYSTEM_USER_SERVICE_HPP

#include <string>
#include <vector>
#include <optional>
#include <memory>
#include <stdexcept>
#include "../repositories/user_repository.hpp"
#include "../models/user.hpp"
#include "../utils/logger.hpp"
#include "../common/constants.hpp"

// Re-use BCrypt mock from AuthService for password hashing if needed for updates
#ifndef BCRYPT_MOCK_DEFINED
#define BCRYPT_MOCK_DEFINED
namespace BCrypt {
    std::string generateHash(const std::string& password, int rounds = 10);
    bool validatePassword(const std::string& password, const std::string& hash);
}
#endif

/**
 * @brief Service layer for User-related business logic.
 * Handles retrieving and managing user profiles.
 */
class UserService {
private:
    std::shared_ptr<UserRepository> user_repository;

public:
    /**
     * @brief Constructs a UserService.
     * @param user_repo Shared pointer to the UserRepository.
     */
    explicit UserService(std::shared_ptr<UserRepository> user_repo) : user_repository(std::move(user_repo)) {
        if (!user_repository) {
            LOG_CRITICAL("UserService initialized with a null UserRepository.");
            throw std::runtime_error("UserRepository cannot be null.");
        }
        LOG_DEBUG("UserService initialized.");
    }

    /**
     * @brief Retrieves a user by their ID.
     * @param user_id The ID of the user to retrieve.
     * @return An `std::optional<User>` containing the user if found, `std::nullopt` otherwise.
     */
    std::optional<User> getUserById(int user_id) {
        try {
            return user_repository->findById(user_id);
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to get user by ID {}: {}", user_id, e.what());
            throw; // Re-throw to be caught by error middleware
        }
    }

    /**
     * @brief Updates a user's profile.
     * @param user_id The ID of the user to update.
     * @param new_email The new email for the user (optional).
     * @param new_password The new plain-text password for the user (optional).
     * @param new_role The new role for the user (optional).
     * @return The updated User object.
     * @throws std::runtime_error if user not found, email already exists, or other errors.
     */
    User updateUserProfile(int user_id,
                           const std::optional<std::string>& new_email,
                           const std::optional<std::string>& new_password,
                           const std::optional<std::string>& new_role) {
        std::optional<User> existing_user_opt = user_repository->findById(user_id);
        if (!existing_user_opt) {
            LOG_WARN("Update profile failed: User with ID {} not found.", user_id);
            throw std::runtime_error(Constants::ERR_USER_NOT_FOUND);
        }

        User user = *existing_user_opt;
        bool changed = false;

        if (new_email && *new_email != user.email) {
            // Check for duplicate email if changing
            if (user_repository->findByEmail(*new_email)) {
                LOG_WARN("Update profile failed for user {}: New email '{}' already exists.", user_id, *new_email);
                throw std::runtime_error(Constants::ERR_EMAIL_EXISTS);
            }
            user.email = *new_email;
            changed = true;
        }

        if (new_password) {
            user.password_hash = BCrypt::generateHash(*new_password); // Hash new password
            changed = true;
        }

        if (new_role && *new_role != user.role) {
            user.role = *new_role;
            changed = true;
        }

        if (changed) {
            try {
                if (!user_repository->updateUser(user)) {
                    LOG_ERROR("Failed to update user {} despite changes found (repository returned false).", user_id);
                    throw std::runtime_error(Constants::ERR_INTERNAL_SERVER_ERROR);
                }
                LOG_INFO("User ID {} profile updated.", user_id);
                return *user_repository->findById(user_id); // Fetch updated user from DB
            } catch (const std::exception& e) {
                LOG_ERROR("Failed to update user profile for ID {}: {}", user_id, e.what());
                throw;
            }
        } else {
            LOG_DEBUG("No changes requested for user ID {}.", user_id);
            return user; // Return original user if no changes
        }
    }

    /**
     * @brief Deletes a user by their ID.
     * @param user_id The ID of the user to delete.
     * @return True if the user was deleted, false if not found.
     * @throws std::runtime_error if user not found or other errors.
     */
    bool deleteUser(int user_id) {
        try {
            if (!user_repository->deleteUser(user_id)) {
                LOG_WARN("Deletion failed: User with ID {} not found.", user_id);
                return false; // User not found is not an error here, but indicates no deletion
            }
            LOG_INFO("User ID {} deleted successfully.", user_id);
            return true;
        } catch (const std::exception& e) {
            LOG_ERROR("Failed to delete user ID {}: {}", user_id, e.what());
            throw;
        }
    }
};

#endif // ML_UTILITIES_SYSTEM_USER_SERVICE_HPP
```