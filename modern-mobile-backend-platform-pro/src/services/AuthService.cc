```cpp
#include "AuthService.h"
#include "src/utils/PasswordUtils.h"
#include "src/utils/JWTUtils.h"
#include "src/utils/AppConfig.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <format> // C++20 for std::format

namespace services
{
    AuthService::AuthService(std::shared_ptr<dao::UserDAO> userDAO)
        : userDAO_(std::move(userDAO))
    {
        LOG_INFO("AuthService initialized.");
    }

    std::future<models::User> AuthService::registerUser(const models::RegisterRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid registration data provided.", "INVALID_REGISTRATION_DATA");
        }

        // Check if username or email already exists
        return userDAO_->findByEmailOrUsername(request.email)
            .then([this, request](std::optional<models::User> existingUser) {
                if (existingUser)
                {
                    if (existingUser->email == request.email)
                    {
                        throw api::ConflictException(std::format("User with email '{}' already exists.", request.email), "EMAIL_ALREADY_EXISTS");
                    }
                    if (existingUser->username == request.username)
                    {
                        throw api::ConflictException(std::format("User with username '{}' already exists.", request.username), "USERNAME_ALREADY_EXISTS");
                    }
                }

                models::User newUser;
                newUser.username = request.username;
                newUser.email = request.email;
                newUser.passwordHash = utils::PasswordUtils::hashPassword(request.password);
                newUser.firstName = request.firstName;
                newUser.lastName = request.lastName;

                return userDAO_->create(newUser);
            })
            .then([](models::User createdUser) {
                createdUser.passwordHash = ""; // Clear sensitive data before returning
                LOG_INFO("User '{}' registered successfully.", createdUser.username);
                return createdUser;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; } // Re-throw specific API exceptions
                catch (const std::exception &e) {
                    LOG_ERROR("Error during user registration: {}", e.what());
                    throw api::ApiException(std::format("Failed to register user: {}", e.what()), drogon::k500InternalServerError, "REGISTRATION_FAILED");
                }
                return models::User(); // Should not reach here
            });
    }

    std::future<models::LoginResponse> AuthService::loginUser(const models::LoginRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid login credentials provided.", "INVALID_LOGIN_DATA");
        }

        return userDAO_->findByEmailOrUsername(request.emailOrUsername)
            .then([this, request](std::optional<models::User> userOpt) {
                if (!userOpt)
                {
                    LOG_WARN("Login attempt for '{}': User not found.", request.emailOrUsername);
                    throw api::UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");
                }

                models::User user = *userOpt;

                if (!utils::PasswordUtils::verifyPassword(request.password, user.passwordHash))
                {
                    LOG_WARN("Login attempt for '{}': Invalid password.", request.emailOrUsername);
                    throw api::UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");
                }

                int jwtExpirationMinutes = utils::AppConfig::getInstance().getInt("jwt.expirationMinutes", 120);
                std::string token = utils::JWTUtils::generateToken(user.id, user.username, jwtExpirationMinutes);

                models::LoginResponse response;
                response.token = token;
                response.userId = user.id;
                response.username = user.username;
                response.email = user.email;

                LOG_INFO("User '{}' logged in successfully.", user.username);
                return response;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error during user login: {}", e.what());
                    throw api::ApiException(std::format("Failed to login user: {}", e.what()), drogon::k500InternalServerError, "LOGIN_FAILED");
                }
                return models::LoginResponse(); // Should not reach here
            });
    }

} // namespace services
```