```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include "../services/UserService.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Controller for User management endpoints.
 */
class UserController : public drogon::HttpController<UserController> {
public:
    // Inject UserService
    explicit UserController(UserService userService = UserService());

    METHOD_LIST_BEGIN
    // Public routes (Rate limited but not authenticated here, though services might enforce role)
    // METHOD_ADD(UserController::getUserById, "/{id}", drogon::Get, "RateLimitFilter", "AuthFilter");

    // Authenticated routes, some require 'admin' role
    METHOD_ADD(UserController::getAllUsers, "", drogon::Get, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_ADD(UserController::getUserById, "/{id}", drogon::Get, "RateLimitFilter", "AuthFilter");
    METHOD_ADD(UserController::updateUser, "/{id}", drogon::Patch, "RateLimitFilter", "AuthFilter");
    METHOD_ADD(UserController::deleteUser, "/{id}", drogon::Delete, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_LIST_END

    /**
     * @brief Handles GET /users (Admin Only). Retrieves all users with pagination.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param limit Query parameter for page size.
     * @param offset Query parameter for page offset.
     */
    void getAllUsers(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     long limit = 10, long offset = 0);

    /**
     * @brief Handles GET /users/{id}. Retrieves a single user by ID.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the user.
     */
    void getUserById(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     const std::string& id);

    /**
     * @brief Handles PATCH /users/{id}. Updates a user's details.
     * @param req The HTTP request with JSON payload.
     * @param callback The callback to send the response.
     * @param id The UUID of the user to update.
     */
    void updateUser(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    const std::string& id);

    /**
     * @brief Handles DELETE /users/{id} (Admin Only). Deletes a user.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the user to delete.
     */
    void deleteUser(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    const std::string& id);

private:
    UserService userService;
};
```