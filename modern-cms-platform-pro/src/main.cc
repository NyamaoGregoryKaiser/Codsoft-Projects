#include <drogon/drogon.h>
#include <iostream>
#include <string>

// Controllers
#include "controllers/AuthController.h"
#include "controllers/ContentController.h"
#include "controllers/UserController.h"

// Middlewares
#include "middlewares/AuthMiddleware.h"
#include "middlewares/RateLimitMiddleware.h"
#include "middlewares/ErrorHandlingMiddleware.h"
#include "middlewares/CachingMiddleware.h"

int main() {
    // Load configurations from config.json
    drogon::app().loadConfigFile("config.json");

    // Get configuration values (e.g., JWT secret)
    const auto& jwtConfig = drogon::app().get==>getJsonValue("jwt");
    if (jwtConfig.isObject()) {
        std::string jwtSecret = jwtConfig["secret"].asString();
        // Set the JWT secret globally or pass to JwtManager
        // For JwtManager::setSecret, it's called in JwtManager.cc constructor
    } else {
        LOG_WARN << "JWT configuration not found or invalid. Using default/empty secret.";
    }

    // Set up database connection (Drogon handles this based on config.json)
    // Make sure 'db' section in config.json is correct.

    // Register Middlewares
    // Order matters: Rate Limiting -> Authentication -> Caching -> Error Handling
    // ErrorHandlingMiddleware should ideally be a global handler registered differently or very early.
    // For Drogon, apply as a custom filter or a global handler.
    // Drogon provides `app().setExceptionHandler` for global exception handling.
    drogon::app().registerHandler("/",
                                  "get",
                                  [](const drogon::HttpRequestPtr &req,
                                     std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
                                      auto resp = drogon::HttpResponse::newFileResponse("static/index.html");
                                      callback(resp);
                                  },
                                  drogon::HandlerKind::Share); // Serve static index.html on root

    // Register API endpoints and apply middlewares
    // Example: ContentController
    drogon::app().registerHandler("/api/v1/content",
                                  "get",
                                  &ContentController::getAllContent,
                                  AuthMiddleware(), CachingMiddleware(), RateLimitMiddleware()); // Public read access, cached
    drogon::app().registerHandler("/api/v1/content/{id}",
                                  "get",
                                  &ContentController::getContentById,
                                  AuthMiddleware(), CachingMiddleware(), RateLimitMiddleware()); // Public read access, cached
    drogon::app().registerHandler("/api/v1/content",
                                  "post",
                                  &ContentController::createContent,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth
    drogon::app().registerHandler("/api/v1/content/{id}",
                                  "put",
                                  &ContentController::updateContent,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth
    drogon::app().registerHandler("/api/v1/content/{id}",
                                  "delete",
                                  &ContentController::deleteContent,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth

    // Example: AuthController
    drogon::app().registerHandler("/api/v1/auth/register",
                                  "post",
                                  &AuthController::registerUser,
                                  RateLimitMiddleware()); // No auth for registration
    drogon::app().registerHandler("/api/v1/auth/login",
                                  "post",
                                  &AuthController::loginUser,
                                  RateLimitMiddleware()); // No auth for login

    // Example: UserController (admin-only)
    drogon::app().registerHandler("/api/v1/users",
                                  "get",
                                  &UserController::getAllUsers,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth (and admin role check inside controller)
    drogon::app().registerHandler("/api/v1/users/{id}",
                                  "get",
                                  &UserController::getUserById,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth (and admin role check inside controller)
    drogon::app().registerHandler("/api/v1/users/{id}",
                                  "put",
                                  &UserController::updateUser,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth (and admin role check inside controller)
    drogon::app().registerHandler("/api/v1/users/{id}",
                                  "delete",
                                  &UserController::deleteUser,
                                  AuthMiddleware(), RateLimitMiddleware()); // Requires auth (and admin role check inside controller)


    // Global Error Handling
    drogon::app().setExceptionHandler([](const drogon::HttpStatusCode &code,
                                         const std::string &message,
                                         const drogon::HttpRequestPtr &req) -> drogon::HttpResponsePtr {
        Json::Value json;
        json["status"] = "error";
        json["code"] = static_cast<int>(code);
        json["message"] = message.empty() ? drogon::HttpResponse::statusCodeToString(code) : message;
        LOG_ERROR << "Unhandled exception caught for path: " << req->getPath() << ", message: " << message;
        return drogon::HttpResponse::newHttpJsonResponse(json);
    });

    // Run the application
    LOG_INFO << "Server started on port " << drogon::app().get //==>getAppConfig()["app"]["port"].asInt();
    drogon::app().run();

    return 0;
}