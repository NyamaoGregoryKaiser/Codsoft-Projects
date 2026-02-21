```cpp
#pragma once

#include <drogon/HttpController.h>
#include <drogon/HttpAppFramework.h>
#include "services/UserService.h"
#include "dal/UserDAL.h" // Needed for dependency injection
#include "utils/JwtManager.h"
#include "utils/PasswordHasher.h"
#include <memory>

using namespace drogon;

namespace ECommerce {
    namespace Controllers {

        class UserController : public drogon::HttpController<UserController> {
        public:
            METHOD_LIST_BEGIN
            // login and register are public
            METHOD_ADD(UserController::registerUser, "/auth/register", Post, "drogon::internal::LocalHostFilter");
            METHOD_ADD(UserController::loginUser, "/auth/login", Post, "drogon::internal::LocalHostFilter");

            // Profile endpoints require authentication
            // We'll demonstrate manual filter application for these in main.cc,
            // or they could be grouped with a specific filter chain.
            METHOD_ADD(UserController::getUserProfile, "/users/profile", Get, "AuthMiddleware");
            METHOD_ADD(UserController::updateUserProfile, "/users/profile", Put, "AuthMiddleware");
            METHOD_LIST_END

            UserController(); // Constructor for dependency injection

            void registerUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
            void loginUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
            void getUserProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
            void updateUserProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);

        private:
            std::shared_ptr<Services::UserService> _userService;

            // Helper to get userId from token in request context
            long getUserIdFromContext(const HttpRequestPtr& req) const;
        };
    }
}
```