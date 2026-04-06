#pragma once

#include <string>
#include <vector>
#include <optional>
#include "../repositories/user_repository.h"
#include "../models/user.h"
#include "../utils/custom_exceptions.h"
#include "../utils/argon2_hasher.h" // For password changes
#include "../utils/logger.h"

namespace Services {

class UserService {
public:
    UserService(Repositories::UserRepository& user_repo, Security::Argon2Hasher& hasher)
        : user_repo_(user_repo), hasher_(hasher) {}

    Models::User getUserById(const std::string& id) {
        std::optional<Models::User> user_opt = user_repo_.findById(id);
        if (!user_opt) {
            LOG_WARN("Attempted to get non-existent user by ID: {}", id);
            throw CustomExceptions::NotFoundException("User not found.");
        }
        return *user_opt;
    }

    // Example of updating user details
    Models::User updateUserDetails(const std::string& id, const std::string& email, const std::optional<std::string>& new_password, const std::string& role_str) {
        Models::User user = getUserById(id); // Throws if not found

        // Check if new email conflicts with another user
        if (user.email != email) {
            if (user_repo_.findByEmail(email)) {
                LOG_WARN("Attempted to update user {} with existing email: {}", id, email);
                throw CustomExceptions::ConflictException("Email already taken by another user.");
            }
            user.email = email;
        }

        // Handle password change if provided
        if (new_password) {
            user.password_hash = hasher_.hashPassword(*new_password);
            LOG_INFO("Password updated for user ID: {}", id);
        }

        // Update role
        std::optional<Models::UserRole> role = Models::stringToUserRole(role_str);
        if (!role) {
            throw CustomExceptions::BadRequestException("Invalid user role specified.");
        }
        user.role = *role;

        user_repo_.updateUser(user);
        LOG_INFO("User details updated for user ID: {}", id);
        return user;
    }

    void deleteUser(const std::string& id) {
        user_repo_.deleteUser(id); // Throws if not found
        LOG_INFO("User deleted: ID={}", id);
    }

private:
    Repositories::UserRepository& user_repo_;
    Security::Argon2Hasher& hasher_;
};

} // namespace Services