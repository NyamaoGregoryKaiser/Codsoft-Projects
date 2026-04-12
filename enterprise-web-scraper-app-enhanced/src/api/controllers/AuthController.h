```cpp
#ifndef AUTH_CONTROLLER_H
#define AUTH_CONTROLLER_H

#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../../auth/AuthManager.h"
#include "../../utils/Logger.h"
#include "../../utils/ErrorHandler.h"
#include "../DTOs.h"

namespace Scraper {
namespace API {
namespace Controllers {

class AuthController {
public:
    void setupRoutes(Pistache::Rest::Router& router) {
        Pistache::Rest::Routes::Post(router, "/api/v1/auth/register",
                                      Pistache::Rest::Routes::bind(&AuthController::handleRegister, this));
        Pistache::Rest::Routes::Post(router, "/api/v1/auth/login",
                                      Pistache::Rest::Routes::bind(&AuthController::handleLogin, this));
    }

private:
    void handleRegister(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            DTOs::RegisterRequest req = DTOs::RegisterRequest::fromJson(nlohmann::json::parse(request.body()));

            std::optional<std::string> token = Scraper::Auth::AuthManager::getInstance().registerUser(
                req.username, req.email, req.password
            );

            if (token) {
                DTOs::AuthResponse res{*token, "User registered successfully."};
                response.send(Pistache::Http::Code::Created, res.toJson().dump(), Pistache::Http::Mime::MediaType("application/json"));
            } else {
                logger->error("Registration failed for unknown reason for user: {}", req.username);
                throw Scraper::Utils::ScraperException("Registration failed.");
            }
        } catch (const nlohmann::json::exception& e) {
            logger->error("JSON parsing error: {}", e.what());
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::BadRequestException("Invalid JSON format."), 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::BadRequestException& e) {
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(e, 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleRegister: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }

    void handleLogin(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
        auto logger = Scraper::Utils::Logger::get_logger();
        try {
            DTOs::LoginRequest req = DTOs::LoginRequest::fromJson(nlohmann::json::parse(request.body()));

            std::optional<std::string> token = Scraper::Auth::AuthManager::getInstance().loginUser(
                req.username, req.password
            );

            if (token) {
                DTOs::AuthResponse res{*token, "Login successful."};
                response.send(Pistache::Http::Code::Ok, res.toJson().dump(), Pistache::Http::Mime::MediaType("application/json"));
            } else {
                logger->warn("Login failed for unknown reason for user: {}", req.username);
                throw Scraper::Utils::UnauthorizedException("Login failed.");
            }
        } catch (const nlohmann::json::exception& e) {
            logger->error("JSON parsing error: {}", e.what());
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::BadRequestException("Invalid JSON format."), 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::BadRequestException& e) {
            response.send(Pistache::Http::Code::BadRequest,
                          Scraper::Utils::exceptionToJson(e, 400).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::UnauthorizedException& e) {
            response.send(Pistache::Http::Code::Unauthorized,
                          Scraper::Utils::exceptionToJson(e, 401).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const Scraper::Utils::ScraperException& e) {
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(e, 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        } catch (const std::exception& e) {
            logger->error("Unhandled exception in handleLogin: {}", e.what());
            response.send(Pistache::Http::Code::InternalServerError,
                          Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                          Pistache::Http::Mime::MediaType("application/json"));
        }
    }
};

} // namespace Controllers
} // namespace API
} // namespace Scraper

#endif // AUTH_CONTROLLER_H
```