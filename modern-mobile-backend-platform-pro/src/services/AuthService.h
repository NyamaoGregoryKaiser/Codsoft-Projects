```cpp
#pragma once

#include "src/dao/UserDAO.h"
#include "src/models/User.h"
#include "src/models/DTOs.h"
#include <memory>
#include <string>
#include <future>

namespace services
{
    /**
     * @brief Service for user authentication and authorization.
     * Handles user registration, login, and token management.
     */
    class AuthService
    {
    public:
        /**
         * @brief Constructor for AuthService.
         * @param userDAO Shared pointer to the UserDAO instance.
         */
        explicit AuthService(std::shared_ptr<dao::UserDAO> userDAO);

        /**
         * @brief Registers a new user.
         * Hashes the password and stores user details in the database.
         * @param request The registration request containing user details.
         * @return A Future that resolves to the created User object (without password hash).
         * @throws api::BadRequestException if input is invalid.
         * @throws api::ConflictException if username or email already exists.
         * @throws api::ApiException on other errors.
         */
        std::future<models::User> registerUser(const models::RegisterRequest &request);

        /**
         * @brief Logs in a user.
         * Verifies credentials and generates a JWT on successful login.
         * @param request The login request containing email/username and password.
         * @return A Future that resolves to a LoginResponse containing token and user info.
         * @throws api::BadRequestException if input is invalid.
         * @throws api::UnauthorizedException if credentials are invalid.
         * @throws api::ApiException on other errors.
         */
        std::future<models::LoginResponse> loginUser(const models::LoginRequest &request);

    private:
        std::shared_ptr<dao::UserDAO> userDAO_;
    };

} // namespace services
```