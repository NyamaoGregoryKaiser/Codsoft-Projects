#include "PasswordHasher.h"
#include "utils/Logger.h" // For logging errors
#include <stdexcept>
#include <cstring> // For strlen

// Link with libbcrypt. If compiling directly, ensure `bcrypt.c` is compiled and linked.
// For drogons build system, ensure bcrypt library is available or integrated.
// For this example, we assume libbcrypt is available in the build environment.
// In a real project, you'd typically include the source or link the library.
// For simplicity in this template, we'll manually declare external bcrypt functions.
// If not using a system-installed libbcrypt, you'd integrate its source.

std::string PasswordHasher::hashPassword(const std::string& password, int rounds) {
    if (password.empty()) {
        LOG_WARN("Attempted to hash an empty password.");
        return "";
    }

    // A salt buffer large enough for bcrypt salt string (BCRYPT_SALT_LEN is 29)
    char salt[60]; // ~48 chars for salt + NUL
    char hashed[100]; // ~60 chars for hash + NUL

    // Generate salt
    if (bcrypt_gensalt(rounds, salt) != nullptr) {
        LOG_ERROR("Failed to generate bcrypt salt.");
        return "";
    }

    // Hash the password
    if (bcrypt_hashpw(password.c_str(), salt, hashed) != nullptr) {
        LOG_ERROR("Failed to hash password with bcrypt.");
        return "";
    }

    return std::string(hashed);
}

bool PasswordHasher::verifyPassword(const std::string& password, const std::string& hashedPassword) {
    if (password.empty() || hashedPassword.empty()) {
        LOG_WARN("Attempted to verify with empty password or hashed password.");
        return false;
    }

    // bcrypt_checkpw returns 0 on success, non-zero on failure
    int result = bcrypt_checkpw(password.c_str(), hashedPassword.c_str());
    return result == 0;
}
```