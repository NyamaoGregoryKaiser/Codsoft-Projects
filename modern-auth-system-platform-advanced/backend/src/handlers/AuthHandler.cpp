#include "AuthHandler.h"
#include "../middleware/AuthMiddleware.h" // For currentRequestUser during logout/profile

AuthHandler::AuthHandler(Pistache::Rest::Router& router) {
    // Public routes (no authentication required)
    Pistache::Rest::Routes::Post(router, "/api/auth/register", Pistache::Rest::Routes::bind(&AuthHandler::registerUser, this));
    Pistache::Rest::Routes::Post(router, "/api/auth/login", Pistache::Rest::Routes::bind(&AuthHandler::loginUser, this));
    Pistache::Rest::Routes::Post(router, "/api/auth/refresh", Pistache::Rest::Routes::bind(&AuthHandler::refreshToken, this));
    
    // Protected routes (authentication required)
    Pistache::Rest::Routes::Post(router, "/api/auth/logout", Pistache::Rest::Routes::bind(&AuthHandler::logoutUser, this));
}

void AuthHandler::registerUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        nlohmann::json reqBody = nlohmann::json::parse(request.body());
        std::string username = reqBody.at("username").get<std::string>();
        std::string password = reqBody.at("password").get<std::string>();
        std::string roleStr = reqBody.value("role", "USER"); // Default role is USER

        if (username.empty() || password.empty()) {
            throw AuthException(AuthErrorType::BadRequest, "Username and password cannot be empty.");
        }
        
        if (username.length() < 3 || password.length() < 6) {
            throw AuthException(AuthErrorType::BadRequest, "Username must be at least 3 characters and password at least 6 characters.");
        }

        // Convert role string to enum, default to USER if invalid
        UserRole role = UserRole::USER;
        if (roleStr == "ADMIN") { // Only allow ADMIN role if it's explicitly set and potentially restricted later
             Logger::getLogger()->warn("Attempt to register user '{}' with ADMIN role. This should be restricted to internal tools.", username);
             // For simplicity, we allow it here, but in a real system,
             // only an existing admin could create other admins.
             role = UserRole::ADMIN;
        }

        // Check if user already exists
        if (DBManager::getInstance().findUserByUsername(username).has_value()) {
            throw AuthException(AuthErrorType::UserAlreadyExists, "User with this username already exists.");
        }

        std::string hashedPassword = PasswordHasher::hashPassword(password);
        std::optional<User> newUser = DBManager::getInstance().createUser(username, hashedPassword, role);

        if (!newUser.has_value()) {
            throw AuthException(AuthErrorType::InternalError, "Failed to create user in the database.");
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "User registered successfully";
        resBody["user"] = newUser->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Created, resBody.dump());
        Logger::getLogger()->info("User '{}' registered successfully.", username);

    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format or missing fields: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e; // Re-throw custom AuthExceptions
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Registration failed: " + std::string(e.what()));
    }
}

void AuthHandler::loginUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        nlohmann::json reqBody = nlohmann::json::parse(request.body());
        std::string username = reqBody.at("username").get<std::string>();
        std::string password = reqBody.at("password").get<std::string>();

        std::optional<User> user = DBManager::getInstance().findUserByUsername(username);

        if (!user.has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "Invalid credentials.");
        }

        if (!PasswordHasher::verifyPassword(password, user->getPasswordHash())) {
            throw AuthException(AuthErrorType::InvalidCredentials, "Invalid credentials.");
        }

        // Generate JWTs
        std::string accessToken = JWTManager::generateAccessToken(user->getId().value(), user->getUsername(), user->getRole());
        std::string refreshToken = JWTManager::generateRefreshToken(user->getId().value(), user->getUsername(), user->getRole());

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "Login successful";
        resBody["user"] = user->toJson();
        resBody["accessToken"] = accessToken;
        resBody["refreshToken"] = refreshToken;

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("User '{}' logged in successfully.", username);

    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format or missing fields: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Login failed: " + std::string(e.what()));
    }
}

void AuthHandler::refreshToken(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        nlohmann::json reqBody = nlohmann::json::parse(request.body());
        std::string refreshTokenString = reqBody.at("refreshToken").get<std::string>();

        auto claims = JWTManager::decodeToken(refreshTokenString, Config::getJwtRefreshSecret());
        if (!claims.has_value() || claims->tokenType != "refresh") {
            throw AuthException(AuthErrorType::InvalidToken, "Invalid or expired refresh token.");
        }

        // Re-issue new access and refresh tokens
        std::string newAccessToken = JWTManager::generateAccessToken(claims->userId, claims->username, claims->role);
        std::string newRefreshToken = JWTManager::generateRefreshToken(claims->userId, claims->username, claims->role);

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "Tokens refreshed successfully";
        resBody["accessToken"] = newAccessToken;
        resBody["refreshToken"] = newRefreshToken;

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("Tokens refreshed for user ID {}.", claims->userId);

    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format or missing refresh token: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Token refresh failed: " + std::string(e.what()));
    }
}

void AuthHandler::logoutUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        // In a stateless JWT system, logout is often client-side (delete tokens)
        // However, we can still invalidate refresh tokens server-side if we implemented a token blacklist/whitelist.
        // For simplicity, this acts as a confirmation and clears any server-side session (not implemented here).

        if (!Middleware::currentRequestUser.has_value()) {
            throw AuthException(AuthErrorType::Unauthorized, "Not logged in.");
        }
        
        Logger::getLogger()->info("User '{}' (ID: {}) logged out.", Middleware::currentRequestUser->username, Middleware::currentRequestUser->userId);

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "Logged out successfully.";

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());

    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Logout failed: " + std::string(e.what()));
    }
}