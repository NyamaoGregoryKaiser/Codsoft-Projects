#pragma once

#include <string>
#include <vector>

// Forward declaration for bcrypt functions
extern "C" {
    char* bcrypt_gensalt(int rounds, char* salt);
    char* bcrypt_hashpw(const char* password, const char* salt, char* hashed);
    int bcrypt_checkpw(const char* password, const char* hashed);
}

class PasswordHasher {
public:
    // Hashes a plain-text password using bcrypt.
    // @param password The plain-text password.
    // @param rounds The cost factor (number of rounds) for bcrypt. Default is 10.
    // @return The hashed password string, or an empty string on error.
    static std::string hashPassword(const std::string& password, int rounds = 10);

    // Verifies a plain-text password against a hashed password.
    // @param password The plain-text password.
    // @param hashedPassword The bcrypt hashed password.
    // @return True if the password matches, false otherwise.
    static bool verifyPassword(const std::string& password, const std::string& hashedPassword);
};
```