#include "PasswordHasher.h"
#include "../logger/Logger.h"
#include <bcrypt.h> // From cpp-bcrypt library
#include <stdexcept>

std::string PasswordHasher::hashPassword(const std::string& plainPassword) {
    char salt[BCRYPT_HASHSIZE];
    char hash[BCRYPT_HASHSIZE];

    if (bcrypt_gensalt(BCRYPT_WORK_FACTOR, salt) != 0) {
        Logger::getLogger()->error("Failed to generate bcrypt salt.");
        throw std::runtime_error("Failed to generate bcrypt salt.");
    }

    if (bcrypt_hashpw(plainPassword.c_str(), salt, hash) != 0) {
        Logger::getLogger()->error("Failed to hash password.");
        throw std::runtime_error("Failed to hash password.");
    }

    return std::string(hash);
}

bool PasswordHasher::verifyPassword(const std::string& plainPassword, const std::string& hashedPassword) {
    if (hashedPassword.length() != BCRYPT_HASHSIZE -1) { // -1 for null terminator
        Logger::getLogger()->warn("Invalid hash length provided for verification.");
        return false;
    }
    
    // bcrypt_checkpw returns 0 on success, non-zero on failure
    bool result = (bcrypt_checkpw(plainPassword.c_str(), hashedPassword.c_str()) == 0);
    if (!result) {
        Logger::getLogger()->debug("Password verification failed for plain text: {}", plainPassword);
    }
    return result;
}