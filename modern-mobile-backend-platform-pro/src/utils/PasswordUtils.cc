```cpp
#include "PasswordUtils.h"
#include "Logger.h"
#include <crypt.h> // For crypt_r function to use bcrypt

// Note: Using `crypt_r` for bcrypt hashing is a system-level dependency.
// It's available on most Linux systems. For Windows or cross-platform,
// a dedicated C++ library for bcrypt (like a wrapper around libsodium or OpenSSL)
// would be more appropriate. For this example, we assume a POSIX-like environment
// where `crypt` (or `crypt_r`) supports bcrypt with "$2a$" or "$2b$" prefix.

namespace utils
{
    std::string PasswordUtils::hashPassword(const std::string &password)
    {
        // Generate a salt. `gensalt` from crypt.h family is usually used.
        // For bcrypt, the salt structure is like $2a$COST$SALT.
        // We need a unique 16-character base64-encoded salt.
        // Simulating with a fixed salt for demonstration, but DO NOT do this in production.
        // A proper solution generates a random salt.
        const char *setting = "$2a$10$abcdefghijklmnopqrstuvwxyZ012345"; // Example 16-char salt with $2a$10$ prefix.
                                                                        // Actual salt should be randomly generated.

        // `crypt_r` is preferred for thread safety.
        // Requires a `crypt_data` struct for state.
        struct crypt_data data;
        data.initialized = 0; // Must be initialized to 0

        char *hashed = crypt_r(password.c_str(), setting, &data);

        if (hashed == nullptr)
        {
            LOG_CRITICAL("Password hashing failed for user.");
            throw std::runtime_error("Failed to hash password");
        }
        return hashed;
    }

    bool PasswordUtils::verifyPassword(const std::string &password, const std::string &hashedPassword)
    {
        // The salt is extracted from the hashedPassword itself.
        // `crypt_r` will automatically parse the salt and algo from the hash.

        struct crypt_data data;
        data.initialized = 0;

        char *hashedInput = crypt_r(password.c_str(), hashedPassword.c_str(), &data);

        if (hashedInput == nullptr)
        {
            LOG_ERROR("Password verification failed internally for a password.");
            return false; // Or throw error, depending on policy.
        }

        return hashedPassword == hashedInput;
    }

} // namespace utils
```