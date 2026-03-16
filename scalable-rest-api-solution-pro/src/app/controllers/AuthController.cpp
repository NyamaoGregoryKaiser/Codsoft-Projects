```cpp
#include "AuthController.h"
#include "core/utils/Logger.h"
#include "app/services/AuthService.h"
#include <stdexcept>

using namespace Pistache;
using namespace nlohmann;

void AuthController::registerUser(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        json request_body = json::parse(request.body());
        std::string username = request_body.at("username").get<std::string>();
        std::string email = request_body.at("email").get<std::string>();
        std::string password = request_body.at("password").get<std::string>();

        if (username.empty() || email.empty() || password.empty()) {
            response.send(Http::Code::Bad_Request, json({{"message", "Missing required fields"}}).dump());
            return;
        }

        User new_user = AuthService::registerUser(username, email, password);
        response.send(Http::Code::Created, new_user.toJson().dump(), MIME(Application, Json));
        Logger::info("User registered: {}", new_user.username);

    } catch (const json::parse_error& e) {
        Logger::warn("AuthController::registerUser - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::out_of_range& e) {
        Logger::warn("AuthController::registerUser - Missing JSON field: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Missing required JSON fields (username, email, password)"}}).dump());
    } catch (const std::runtime_error& e) {
        Logger::error("AuthController::registerUser - Runtime error: {}", e.what());
        // Custom error for existing user
        if (std::string(e.what()).find("User with this email already exists") != std::string::npos) {
            response.send(Http::Code::Conflict, json({{"message", e.what()}}).dump());
        } else {
            response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
        }
    } catch (const std::exception& e) {
        Logger::critical("AuthController::registerUser - Unhandled exception: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", "An unexpected error occurred"}}).dump());
    }
}

void AuthController::loginUser(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        json request_body = json::parse(request.body());
        std::string email = request_body.at("email").get<std::string>();
        std::string password = request_body.at("password").get<std::string>();

        if (email.empty() || password.empty()) {
            response.send(Http::Code::Bad_Request, json({{"message", "Missing required fields"}}).dump());
            return;
        }

        std::optional<std::string> token = AuthService::loginUser(email, password);

        if (token) {
            response.send(Http::Code::Ok, json({{"message", "Login successful"}, {"token", *token}}).dump(), MIME(Application, Json));
            Logger::info("User {} logged in.", email);
        } else {
            response.send(Http::Code::Unauthorized, json({{"message", "Invalid credentials"}}).dump());
            Logger::warn("Failed login attempt for user {}.", email);
        }

    } catch (const json::parse_error& e) {
        Logger::warn("AuthController::loginUser - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::out_of_range& e) {
        Logger::warn("AuthController::loginUser - Missing JSON field: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Missing required JSON fields (email, password)"}}).dump());
    } catch (const std::runtime_error& e) {
        Logger::error("AuthController::loginUser - Runtime error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    } catch (const std::exception& e) {
        Logger::critical("AuthController::loginUser - Unhandled exception: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", "An unexpected error occurred"}}).dump());
    }
}
```