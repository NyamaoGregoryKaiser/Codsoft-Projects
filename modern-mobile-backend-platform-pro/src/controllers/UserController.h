```cpp
#pragma once

#include "BaseController.h"
#include "src/services/UserService.h"
#include <memory>

namespace controllers
{
    /**
     * @brief Controller for user profile management endpoints.
     * Inherits from BaseController for common utilities and error handling.
     * Requires authentication for most endpoints.
     */
    class UserController : public drogon::HttpController<UserController>, public BaseController
    {
    public:
        /**
         * @brief Constructor for UserController.
         * @param userService Shared pointer to the UserService instance.
         */
        explicit UserController(std::shared_ptr<services::UserService> userService);

        METHOD_LIST_BEGIN
        // API group "/api/v1/users"
        ADD_METHOD_TO(UserController::getProfile, "/api/v1/users/{id}", drogon::Get, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(UserController::updateProfile, "/api/v1/users/{id}", drogon::Put, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(UserController::deleteUser, "/api/v1/users/{id}", drogon::Delete, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(UserController::getAllUsers, "/api/v1/users", drogon::Get, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware}); // Admin only typically
        METHOD_LIST_END

        /**
         * @brief Retrieves a user's profile by ID.
         * A user can only retrieve their own profile or an admin can retrieve any.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the user to retrieve.
         */
        void getProfile(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Updates a user's profile.
         * A user can only update their own profile.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the user to update.
         */
        void updateProfile(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Deletes a user.
         * A user can only delete their own account.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the user to delete.
         */
        void deleteUser(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Retrieves all users.
         * This endpoint would typically require additional authorization (e.g., admin role).
         * For this example, it's just authenticated.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void getAllUsers(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

    private:
        std::shared_ptr<services::UserService> userService_;
    };

} // namespace controllers
```