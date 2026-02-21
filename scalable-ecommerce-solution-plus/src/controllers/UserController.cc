```cpp
#include "UserController.h"
#include "models/User.h"
#include "exceptions/ApiException.h"
#include <json/json.h>
#include <spdlog/spdlog.h>

namespace ECommerce {
    namespace Controllers {

        UserController::UserController() {
            // Manual Dependency Injection (for simplicity in this example).
            // In a larger system, use a proper DI container (e.g., Boost.DI, or custom).
            auto dbClient = app().getDbClient(); // Get Drogon's default DB client
            auto userDAL = std::make_shared<DAL::UserDAL>(dbClient);
            auto jwtManager = std::make_shared<Utils::JwtManager>(
                app().get<std::string>("jwt_secret", "supersecretjwtkey"), // Get from app config
                app().get<int>("jwt_expiry_hours", 24) // Get from app config
            );
            auto passwordHasher = std::make_shared<Utils::PasswordHasher>();
            _userService = std::make_shared<Services::UserService>(userDAL, jwtManager, passwordHasher);
        }

        void UserController::registerUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
            Json::Value reqJson;
            try {
                reqJson = *req->get  <Json::Value>();
            } catch (const std::exception& e) {
                throw ApiException("Invalid JSON format", 400);
            }

            Models::UserRegisterDTO userDto;
            userDto.fromJson(reqJson);

            _userService->registerUser(userDto)
                .then([callback](std::string jwtToken) {
                    Json::Value respJson;
                    respJson["message"] = "User registered successfully";
                    respJson["token"] = jwtToken;
                    auto resp = HttpResponse::newHttpJsonResponse(respJson);
                    callback(resp);
                })
                .mapException([callback](const std::exception& e) {
                    // Exceptions are caught by main.cc's global handler, or specific API exceptions here.
                    // For brevity, we let it propagate to the global handler.
                    spdlog::error("Error in registerUser: {}", e.what());
                    throw; // Re-throw to be caught by global handler
                });
        }

        void UserController::loginUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
            Json::Value reqJson;
            try {
                reqJson = *req->get  <Json::Value>();
            } catch (const std::exception& e) {
                throw ApiException("Invalid JSON format", 400);
            }

            Models::UserLoginDTO userDto;
            userDto.fromJson(reqJson);

            _userService->loginUser(userDto)
                .then([callback](std::string jwtToken) {
                    Json::Value respJson;
                    respJson["message"] = "Login successful";
                    respJson["token"] = jwtToken;
                    auto resp = HttpResponse::newHttpJsonResponse(respJson);
                    callback(resp);
                })
                .mapException([callback](const std::exception& e) {
                    spdlog::error("Error in loginUser: {}", e.what());
                    throw;
                });
        }

        void UserController::getUserProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
            long userId = getUserIdFromContext(req); // Extracted by AuthMiddleware and stored in request context

            _userService->getUserProfile(userId)
                .then([callback](const Models::User& user) {
                    Json::Value respJson = user.toJson();
                    auto resp = HttpResponse::newHttpJsonResponse(respJson);
                    callback(resp);
                })
                .mapException([callback](const std::exception& e) {
                    spdlog::error("Error in getUserProfile: {}", e.what());
                    throw;
                });
        }

        void UserController::updateUserProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
            long userId = getUserIdFromContext(req);
            Json::Value reqJson;
            try {
                reqJson = *req->get  <Json::Value>();
            } catch (const std::exception& e) {
                throw ApiException("Invalid JSON format", 400);
            }

            Models::User userUpdate;
            userUpdate.fromJson(reqJson);
            userUpdate.id = userId; // Ensure we update the correct user

            _userService->updateUserProfile(userId, userUpdate)
                .then([callback](const Models::User& updatedUser) {
                    Json::Value respJson = updatedUser.toJson();
                    respJson["message"] = "Profile updated successfully";
                    auto resp = HttpResponse::newHttpJsonResponse(respJson);
                    callback(resp);
                })
                .mapException([callback](const std::exception& e) {
                    spdlog::error("Error in updateUserProfile: {}", e.what());
                    throw;
                });
        }

        long UserController::getUserIdFromContext(const HttpRequestPtr& req) const {
            if (!req->get<long>("userId")) {
                // This should ideally not happen if AuthMiddleware is correctly applied
                throw ApiException("Authentication context missing: user ID not found.", 500);
            }
            return *req->get<long>("userId");
        }
    }
}
```