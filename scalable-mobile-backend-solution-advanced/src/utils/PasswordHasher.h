```cpp
#pragma once

#include <string>

/**
 * @brief Utility class for hashing and verifying passwords using bcrypt.
 *
 * This class provides static methods to handle password security,
 * ensuring passwords are never stored in plaintext.
 */
class PasswordHasher {
public:
    /**
     * @brief Generates a bcrypt hash for the given plaintext password.
     * @param password The plaintext password to hash.
     * @param rounds The number of hashing rounds (cost factor). Higher is more secure but slower.
     * @return The bcrypt hash string, or an empty string if hashing fails.
     */
    static std::string hashPassword(const std::string& password, int rounds = 10);

    /**
     * @brief Verifies a plaintext password against a bcrypt hash.
     * @param password The plaintext password to verify.
     * @param hashedPassword The stored bcrypt hash.
     * @return True if the password matches the hash, false otherwise.
     */
    static bool verifyPassword(const std::string& password, const std::string& hashedPassword);

private:
    PasswordHasher() = delete; // Prevent instantiation
};
```