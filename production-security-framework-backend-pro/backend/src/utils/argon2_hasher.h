#pragma once

#include <string>
#include <stdexcept>
#include <sodium.h> // libsodium for argon2id

namespace Security {

class Argon2Hasher {
public:
    static std::string hashPassword(const std::string& password) {
        if (sodium_init() < 0) {
            throw std::runtime_error("libsodium initialization failed");
        }

        char hashed_password[crypto_pwhash_STRBYTES];
        if (crypto_pwhash_str(hashed_password,
                              password.c_str(), password.length(),
                              crypto_pwhash_OPSLIMIT_MODERATE,
                              crypto_pwhash_MEMLIMIT_MODERATE) != 0) {
            throw std::runtime_error("Failed to hash password with Argon2id");
        }
        return hashed_password;
    }

    static bool verifyPassword(const std::string& password, const std::string& hashedPassword) {
        if (sodium_init() < 0) {
            throw std::runtime_error("libsodium initialization failed");
        }

        if (crypto_pwhash_str_verify(hashedPassword.c_str(),
                                     password.c_str(), password.length()) != 0) {
            return false; // Passwords do not match
        }
        return true; // Passwords match
    }
};

} // namespace Security