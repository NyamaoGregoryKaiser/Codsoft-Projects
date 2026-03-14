#pragma once

#include <string>

// Include bcrypt.h from a bcrypt library (e.g., from an installed `libbcrypt` package
// or a header-only library like `bcrypt-cpp` if integrated)
// For demonstration, we'll provide a mock implementation or assume `bcrypt.h` is available
// For a full implementation, you'd link against a library like `libbcrypt` or include a specific header-only bcrypt lib.
// Example: #include <bcrypt/BCrypt.hpp>
// If you don't have a specific bcrypt library set up:
#ifdef USE_MOCK_BCRYPT
namespace BCrypt {
    std::string generateHash(const std::string& password, int rounds) {
        return "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // Mock hash
    }
    bool validatePassword(const std::string& password, const std::string& hash) {
        return password == "password123" || hash == "$2a$10$p0VbT9Xp1B.w.m.Z0Y.7I.b/v4k.N5E6F7G8H9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z"; // Mock validation
    }
}
#else
// Assuming `libbcrypt` is linked or a header-only solution like `bcrypt-cpp` is used.
// For example, if using bcrypt-cpp:
#include "bcrypt_cpp/bcrypt.h" // You would need to add this header/library to your project
#endif

class PasswordHasher {
public:
    static std::string hashPassword(const std::string& password);
    static bool verifyPassword(const std::string& password, const std::string& hashedPassword);
};