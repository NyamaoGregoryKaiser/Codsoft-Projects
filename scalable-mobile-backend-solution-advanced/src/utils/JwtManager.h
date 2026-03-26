```cpp
#pragma once

#include <string>
#include <chrono>
#include <json/json.h> // For claims payload
#include <vector>

// Forward declaration from jwt-cpp library.
// We'll rely on Drogon's JWT configuration in main.cc for secret.
// For direct use of jwt-cpp, we'd include its headers.
// For this example, we assume `jwt::decode` and `jwt::create` work with string secret.
namespace jwt {
    namespace verify {
        class verifier;
    }
    namespace algorithm {
        class hs256;
    }
    class decoded_jwt;
}

/**
 * @brief Manages JWT token creation, signing, and verification.
 *
 * This class encapsulates the logic for JSON Web Token operations,
 * including setting claims, expiration, and validating tokens.
 */
class JwtManager {
public:
    /**
     * @brief Initializes the JwtManager with a global secret key.
     * @param secret The secret key used for signing and verifying JWTs.
     */
    static void init(const std::string& secret);

    /**
     * @brief Generates a new JWT.
     * @param userId The ID of the user for whom the token is generated.
     * @param username The username for whom the token is generated.
     * @param roles A list of roles assigned to the user.
     * @param expiresInMinutes The number of minutes until the token expires.
     * @return The generated JWT string, or an empty string if generation fails.
     */
    static std::string generateToken(const std::string& userId, const std::string& username,
                                     const std::vector<std::string>& roles,
                                     long expiresInMinutes = 60);

    /**
     * @brief Verifies a JWT token and extracts its claims.
     * @param token The JWT string to verify.
     * @return A Json::Value containing the decoded claims if verification is successful,
     *         or an empty Json::Value if verification fails.
     */
    static Json::Value verifyToken(const std::string& token);

private:
    JwtManager() = delete; // Prevent instantiation

    static std::string s_jwtSecret; // Global secret key
};
```