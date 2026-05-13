```cpp
#pragma once

#include <string>
#include <memory>
#include <chrono>
#include <nlohmann/json.hpp>

// Forward declaration of PicoJWT context to avoid including full header
namespace PicoJWT { class Context; }

namespace utils
{
    /**
     * @brief Utility class for JWT (JSON Web Token) generation and validation.
     * Uses PicoJWT library for underlying operations.
     */
    class JWTUtils
    {
    public:
        // Delete copy constructor and assignment operator for static class
        JWTUtils(const JWTUtils &) = delete;
        JWTUtils &operator=(const JWTUtils &) = delete;

        /**
         * @brief Initializes the JWT utility with a secret key.
         * Must be called once before using other methods.
         * @param secret The secret key used for signing and verifying tokens.
         */
        static void initialize(const std::string &secret);

        /**
         * @brief Generates a JWT.
         * @param userId The ID of the user for whom the token is generated.
         * @param username The username of the user.
         * @param expiresInMinutes The expiration time in minutes.
         * @return The signed JWT string.
         * @throws std::runtime_error if token generation fails.
         */
        static std::string generateToken(const std::string &userId, const std::string &username, int expiresInMinutes);

        /**
         * @brief Validates a JWT and extracts its claims.
         * @param token The JWT string to validate.
         * @return A JSON object containing the claims if valid, empty object if invalid.
         */
        static nlohmann::json validateToken(const std::string &token);

        /**
         * @brief Extracts the user ID from a valid JWT.
         * @param token The JWT string.
         * @return The user ID string, or empty if invalid or not found.
         */
        static std::string getUserIdFromToken(const std::string &token);

    private:
        static std::unique_ptr<PicoJWT::Context> jwtContext_;
        static std::string jwtSecret_;

        // Private constructor to prevent instantiation
        JWTUtils() = delete;
    };

} // namespace utils
```