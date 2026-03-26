```cpp
#pragma once

#include <drogon/drogon.h>
#include <string>
#include <vector>
#include <optional>
#include "../models/User.h"
#include "../repositories/UserRepository.h"
#include "../utils/PasswordHasher.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Service for managing user-related business logic.
 *
 * This class provides methods for CRUD operations on users,
 * applying business rules and coordinating with the UserRepository.
 */
class UserService {
public:
    /**
     * @brief Constructs a UserService.
     * @param userRepo The UserRepository instance.
     */
    explicit UserService(UserRepository userRepo = UserRepository());

    /**
     * @brief Retrieves a user by ID.
     * @param id The UUID of the user.
     * @return An optional User object if found.
     * @throws Common::ApiException if the user is not found.
     */
    drogon::Task<std::optional<User>> getUserById(const UUID& id);

    /**
     * @brief Retrieves all users with pagination.
     * @param limit The maximum number of users to retrieve.
     * @param offset The number of users to skip.
     * @return A vector of User objects.
     */
    drogon::Task<std::vector<User>> getAllUsers(size_t limit, size_t offset);

    /**
     * @brief Updates an existing user's information.
     * @param userId The ID of the user to update.
     * @param updatedUsername New username (optional).
     * @param updatedEmail New email (optional).
     * @param newPassword New password (optional, will be hashed).
     * @return The updated User object.
     * @throws Common::ApiException if user is not found, email/username conflict, or invalid password.
     */
    drogon::Task<User> updateUser(const UUID& userId,
                                  std::optional<std::string> updatedUsername,
                                  std::optional<std::string> updatedEmail,
                                  std::optional<std::string> newPassword);

    /**
     * @brief Deletes a user by ID.
     * @param id The UUID of the user to delete.
     * @return True if the user was deleted successfully.
     * @throws Common::ApiException if the user is not found.
     */
    drogon::Task<bool> deleteUser(const UUID& id);

private:
    UserRepository userRepo;
};
```