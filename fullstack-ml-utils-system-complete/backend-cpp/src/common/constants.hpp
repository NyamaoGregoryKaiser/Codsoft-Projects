#ifndef ML_UTILITIES_SYSTEM_CONSTANTS_HPP
#define ML_UTILITIES_SYSTEM_CONSTANTS_HPP

#include <string>

/**
 * @brief A collection of global constants used throughout the application.
 *
 * This class groups various string constants such as JWT claims,
 * user roles, and error messages to ensure consistency and avoid magic strings.
 */
struct Constants {
    // JWT Claims
    static constexpr const char* JWT_ISSUER = "ml-utilities-system";
    static constexpr const char* CLAIM_USER_ID = "user_id";
    static constexpr const char* CLAIM_USER_ROLE = "user_role";

    // User Roles
    static constexpr const char* ROLE_ADMIN = "admin";
    static constexpr const char* ROLE_USER = "user";

    // Error Messages
    static constexpr const char* ERR_INVALID_CREDENTIALS = "Invalid username or password.";
    static constexpr const char* ERR_UNAUTHORIZED = "Unauthorized access.";
    static constexpr const char* ERR_FORBIDDEN = "Access to this resource is forbidden.";
    static constexpr const char* ERR_MODEL_NOT_FOUND = "Model not found.";
    static constexpr const char* ERR_USER_NOT_FOUND = "User not found.";
    static constexpr const char* ERR_INVALID_INPUT = "Invalid input data.";
    static constexpr const char* ERR_DB_ERROR = "Database operation failed.";
    static constexpr const char* ERR_INTERNAL_SERVER_ERROR = "An unexpected error occurred.";
    static constexpr const char* ERR_TOKEN_EXPIRED = "Authentication token expired.";
    static constexpr const char* ERR_TOKEN_INVALID = "Invalid authentication token.";
    static constexpr const char* ERR_MISSING_TOKEN = "Authentication token missing.";
    static constexpr const char* ERR_EMAIL_EXISTS = "Email already registered.";
    static constexpr const char* ERR_NOT_IMPLEMENTED = "Feature not yet implemented.";
};

#endif // ML_UTILITIES_SYSTEM_CONSTANTS_HPP
```