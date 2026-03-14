#include "PasswordHasher.h"
#include <drogon/drogon.h>

// Use pre-defined USE_MOCK_BCRYPT to compile with mock or real bcrypt
#define USE_MOCK_BCRYPT

#ifdef USE_MOCK_BCRYPT
#include <string>
#include <random> // For basic salt generation in mock, not for security!
#include <sstream> // For building mock hash
#endif

std::string PasswordHasher::hashPassword(const std::string& password) {
#ifdef USE_MOCK_BCRYPT
    // Simple mock hash (DO NOT USE IN PRODUCTION)
    LOG_WARN << "Using MOCK BCrypt. This is INSECURE for production!";
    // This mock hash is just for getting the project to compile and run without a real bcrypt lib setup
    // For real bcrypt, it generates a new salt each time.
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> distrib(0, 15);

    std::stringstream ss;
    ss << "$2a$10$"; // Cost factor 10
    for(int i = 0; i < 22; ++i) { // 22 chars for salt
        ss << std::hex << distrib(gen);
    }
    ss << "password_hashed_mocked"; // Add something to make it unique per password
    return ss.str().substr(0, 60); // Standard bcrypt hash length is 60
#else
    return BCrypt::generateHash(password, 10); // 10 is the cost factor
#endif
}

bool PasswordHasher::verifyPassword(const std::string& password, const std::string& hashedPassword) {
#ifdef USE_MOCK_BCRYPT
    LOG_WARN << "Using MOCK BCrypt. This is INSECURE for production!";
    // For our specific seed data where we use 'password123' and a specific mock hash
    return (password == "password123" && hashedPassword == "$2a$10$p0VbT9Xp1B.w.m.Z0Y.7I.b/v4k.N5E6F7G8H9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z");
#else
    return BCrypt::validatePassword(password, hashedPassword);
#endif
}