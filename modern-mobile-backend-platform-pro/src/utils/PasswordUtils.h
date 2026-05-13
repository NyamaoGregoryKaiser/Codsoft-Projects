```cpp
#pragma once

#include <string>
#include <stdexcept>

namespace utils
{
    /**
     * @brief Utility class for password hashing and verification using bcrypt.
     * Note: This implementation uses a simplified approach for bcrypt via a library.
     * In a real project, you'd use a robust C++ bcrypt library (e.g., from OpenSSL or a dedicated one).
     * For demonstration purposes, we'll simulate the interaction with a bcrypt-like hash.
     * A proper C++ bcrypt library would expose functions like `argon2_hash` or `bcrypt_hash`.
     * Here, we'll provide placeholders.
     */
    class PasswordUtils
    {
    public:
        /**
         * @brief Hashes a plain-text password using a strong hashing algorithm (e.g., bcrypt).
         * @param password The plain-text password.
         * @return The hashed password string.
         * @throws std::runtime_error if hashing fails.
         */
        static std::string hashPassword(const std::string &password);

        /**
         * @brief Verifies a plain-text password against a hashed password.
         * @param password The plain-text password.
         * @param hashedPassword The stored hashed password.
         * @return True if the password matches the hash, false otherwise.
         * @throws std::runtime_error if verification fails.
         */
        static bool verifyPassword(const std::string &password, const std::string &hashedPassword);

    private:
        // Private constructor to prevent instantiation as it's a utility class
        PasswordUtils() = delete;
        static const int BCRYPT_WORK_FACTOR = 10; // Adjust for security vs. performance
    };

} // namespace utils
```