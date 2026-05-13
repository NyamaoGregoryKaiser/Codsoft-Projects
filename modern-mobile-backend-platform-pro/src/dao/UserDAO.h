```cpp
#pragma once

#include "BaseDAO.h"
#include "src/models/User.h"
#include <string>
#include <vector>
#include <optional>
#include <future>

namespace dao
{
    /**
     * @brief Data Access Object for User entities.
     * Provides CRUD operations for the 'users' table.
     */
    class UserDAO : public BaseDAO
    {
    public:
        /**
         * @brief Constructor for UserDAO.
         */
        UserDAO();

        /**
         * @brief Creates a new user in the database.
         * @param user The User object containing the data to create.
         * @return A Future that resolves to the created User object (with generated ID).
         * @throws api::ConflictException if username or email already exists.
         * @throws api::ApiException on other database errors.
         */
        std::future<models::User> create(const models::User &user);

        /**
         * @brief Finds a user by their ID.
         * @param id The ID of the user to find.
         * @return A Future that resolves to an optional User object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::User>> findById(const std::string &id);

        /**
         * @brief Finds a user by their username.
         * @param username The username of the user to find.
         * @return A Future that resolves to an optional User object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::User>> findByUsername(const std::string &username);

        /**
         * @brief Finds a user by their email.
         * @param email The email of the user to find.
         * @return A Future that resolves to an optional User object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::User>> findByEmail(const std::string &email);

        /**
         * @brief Finds a user by their email or username.
         * @param emailOrUsername The email or username of the user to find.
         * @return A Future that resolves to an optional User object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::User>> findByEmailOrUsername(const std::string &emailOrUsername);

        /**
         * @brief Updates an existing user in the database.
         * @param user The User object containing the updated data. The ID must be set.
         * @return A Future that resolves to the updated User object.
         * @throws api::NotFoundException if the user with the given ID does not exist.
         * @throws api::ConflictException if username or email is updated to an existing one.
         * @throws api::ApiException on other database errors.
         */
        std::future<models::User> update(const models::User &user);

        /**
         * @brief Deletes a user from the database by ID.
         * @param id The ID of the user to delete.
         * @return A Future that resolves to true if deleted, false if not found.
         * @throws api::ApiException on database errors.
         */
        std::future<bool> remove(const std::string &id);

        /**
         * @brief Retrieves all users from the database.
         * @return A Future that resolves to a vector of User objects.
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::User>> findAll();
    };

} // namespace dao
```