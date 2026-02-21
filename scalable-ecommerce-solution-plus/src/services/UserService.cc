```cpp
#include "UserService.h"
#include <spdlog/spdlog.h>

namespace ECommerce {
    namespace Services {

        UserService::UserService(std::shared_ptr<DAL::UserDAL> userDAL,
                                 std::shared_ptr<Utils::JwtManager> jwtManager,
                                 std::shared_ptr<Utils::PasswordHasher> passwordHasher)
            : _userDAL(std::move(userDAL)), _jwtManager(std::move(jwtManager)), _passwordHasher(std::move(passwordHasher)) {}

        std::future<std::string> UserService::registerUser(const Models::UserRegisterDTO& userDto) {
            if (userDto.username.empty() || userDto.email.empty() || userDto.password.empty()) {
                throw ApiException("Username, email, and password cannot be empty", 400);
            }
            if (userDto.password.length() < 8) {
                throw ApiException("Password must be at least 8 characters long", 400);
            }

            // Check if user already exists
            return _userDAL->findByEmail(userDto.email)
                .then([this, userDto](std::optional<Models::User> existingUser) -> std::future<Models::User> {
                    if (existingUser) {
                        throw ApiException("User with this email already exists", 409);
                    }
                    Models::User newUser;
                    newUser.username = userDto.username;
                    newUser.email = userDto.email;
                    newUser.password_hash = _passwordHasher->hashPassword(userDto.password);
                    newUser.role = "user"; // Default role
                    return _userDAL->createUser(newUser);
                })
                .then([this](const Models::User& createdUser) {
                    spdlog::info("User registered successfully: {}", createdUser.email);
                    return _jwtManager->generateToken(createdUser.id, createdUser.username, createdUser.role);
                });
        }

        std::future<std::string> UserService::loginUser(const Models::UserLoginDTO& userDto) {
            return _userDAL->findByEmail(userDto.email)
                .then([this, userDto](std::optional<Models::User> userOpt) {
                    if (!userOpt) {
                        throw ApiException("Invalid credentials", 401);
                    }
                    Models::User user = userOpt.value();
                    if (!_passwordHasher->verifyPassword(userDto.password, user.password_hash)) {
                        throw ApiException("Invalid credentials", 401);
                    }
                    spdlog::info("User logged in successfully: {}", user.email);
                    return _jwtManager->generateToken(user.id, user.username, user.role);
                });
        }

        std::future<Models::User> UserService::getUserProfile(long userId) {
            return _userDAL->findById(userId)
                .then([](std::optional<Models::User> userOpt) {
                    if (!userOpt) {
                        throw ApiException("User not found", 404);
                    }
                    return userOpt.value();
                });
        }

        std::future<Models::User> UserService::updateUserProfile(long userId, const Models::User& userUpdate) {
            return _userDAL->findById(userId)
                .then([this, userUpdate](std::optional<Models::User> existingUserOpt) -> std::future<Models::User> {
                    if (!existingUserOpt) {
                        throw ApiException("User not found", 404);
                    }
                    Models::User existingUser = existingUserOpt.value();
                    // Update only allowed fields
                    existingUser.username = userUpdate.username.empty() ? existingUser.username : userUpdate.username;
                    // Email might require verification, keep simple for now
                    existingUser.email = userUpdate.email.empty() ? existingUser.email : userUpdate.email;
                    // Password update should be a separate flow (old password, new password)
                    // existingUser.password_hash = ...

                    return _userDAL->updateUser(existingUser);
                });
        }
    }
}
```