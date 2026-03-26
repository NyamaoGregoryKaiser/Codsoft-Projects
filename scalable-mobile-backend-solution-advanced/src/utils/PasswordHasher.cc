```cpp
#include "PasswordHasher.h"
#include "Logger.h"
#include <stdexcept>
#include <cstring> // For std::strlen
// External bcrypt library (libbcrypt)
// You need to link against `libbcrypt`
extern "C" {
    char* bcrypt_hashpass(const char* password, int rounds);
    int bcrypt_checkpass(const char* password, const char* hashed);
}

std::string PasswordHasher::hashPassword(const std::string& password, int rounds) {
    if (password.empty()) {
        LOG_ERROR("Cannot hash an empty password.");
        return "";
    }
    if (rounds < 4 || rounds > 31) {
        LOG_WARN("Bcrypt rounds should be between 4 and 31. Using default 10 instead of {}.", rounds);
        rounds = 10;
    }

    try {
        char* hashed_c_str = bcrypt_hashpass(password.c_str(), rounds);
        if (hashed_c_str == nullptr) {
            LOG_ERROR("Bcrypt hashing failed for password.");
            return "";
        }
        std::string hashedPassword(hashed_c_str);
        free(hashed_c_str); // Free memory allocated by bcrypt_hashpass
        return hashedPassword;
    } catch (const std::exception& e) {
        LOG_CRITICAL("Exception during bcrypt hashing: {}", e.what());
        return "";
    }
}

bool PasswordHasher::verifyPassword(const std::string& password, const std::string& hashedPassword) {
    if (password.empty() || hashedPassword.empty()) {
        LOG_ERROR("Cannot verify empty password or hash.");
        return false;
    }

    // Ensure the hash format is correct for bcrypt (e.g., "$2a$10$...")
    if (hashedPassword.length() != 60 || hashedPassword.rfind("$2a$", 0) != 0) {
        LOG_ERROR("Invalid bcrypt hash format provided for verification.");
        return false;
    }

    try {
        int result = bcrypt_checkpass(password.c_str(), hashedPassword.c_str());
        if (result == 0) { // 0 means match
            return true;
        } else if (result == -1) { // -1 means error
            LOG_ERROR("Bcrypt checkpass failed due to an internal error.");
            return false;
        }
        // Any other non-zero value implies no match
        return false;
    } catch (const std::exception& e) {
        LOG_CRITICAL("Exception during bcrypt verification: {}", e.what());
        return false;
    }
}
```