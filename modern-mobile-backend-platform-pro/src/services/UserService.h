```cpp
#pragma once

#include "src/dao/UserDAO.h"
#include "src/models/User.h"
#include "src/models/DTOs.h"
#include <memory>
#include <string>
#include <vector>
#include <future>

namespace services
{
    /**
     * @brief Service for user profile management.
     * Handles retrieving, updating, and deleting user data.
     */
    class UserService
    {
    public:
        /**
         * @brief Constructor for UserService.
         * @param userDAO Shared pointer to the UserDAO instance.
         */
        explicit UserService(std::shared_ptr<dao::UserDAO> userDAO);

        /**
         * @brief Retrieves a user's profile by ID.
         * @param userId The ID of the user to retrieve.
         * @return A Future that resolves to the User object (without password hash).
         * @throws api::NotFoundException if the user is not found.
         * @throws api::ApiException on other errors.
         */
        std::future<models::User> getUserById(const std::string &userId);

        /**
         * @brief Updates a user's profile.
         * @param userId The ID of the user to update.
         * @param request The update request containing new user details.
         * @return A Future that resolves to the updated User object (without password hash).
         * @throws api::BadRequestException if input is invalid.
         * @throws api::NotFoundException if the user is not found.
         * @throws api::ConflictException if username or email is updated to an existing one.
         * @throws api::ApiException on other errors.
         */
        std::future<models::User> updateUser(const std::string &userId, const models::UpdateUserRequest &request);

        /**
         * @brief Deletes a user by ID.
         * @param userId The ID of the user to delete.
         * @return A Future that resolves to true if deleted.
         * @throws api::NotFoundException if the user is not found.
         * @throws api::ApiException on other errors.
         */
        std::future<bool> deleteUser(const std::string &userId);

        /**
         * @brief Retrieves all users. (Admin-only functionality typically)
         * @return A Future that resolves to a vector of User objects (without password hashes).
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::User>> getAllUsers();

    private:
        std::shared_ptr<dao::UserDAO> userDAO_;
    };

} // namespace services
```