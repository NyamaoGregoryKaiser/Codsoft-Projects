```cpp
#include "PasswordHasher.h"
#include "Logger.h" // For logging errors
#include <random>
#include <sstream>
#include <iomanip> // For std::hex, std::setw, std::setfill

// For SHA256 (OpenSSL)
#include <openssl/sha.h>
#include <openssl/evp.h> // For EVP_MAX_MD_SIZE

namespace ApexContent::Utils {

// Generate a random salt
std::string PasswordHasher::generateSalt(size_t length) {
    std::random_device rd;
    std::mt19937 generator(rd());
    std::uniform_int_distribution<> distrib(0, 255);

    std::string salt_bytes;
    salt_bytes.reserve(length);
    for (size_t i = 0; i < length; ++i) {
        salt_bytes += static_cast<char>(distrib(generator));
    }

    // Convert raw bytes to hex string for storage
    std::stringstream ss;
    for (unsigned char byte : salt_bytes) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)byte;
    }
    return ss.str();
}

// SHA256 hash function
std::string PasswordHasher::sha256(const std::string& str) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, str.c_str(), str.length());
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

std::pair<std::string, std::string> PasswordHasher::hashPassword(const std::string& password) {
    std::string salt = generateSalt();
    std::string saltedPassword = password + salt;
    std::string hashedPassword = sha256(saltedPassword);
    LOG_DEBUG << "Hashed password. Salt: " << salt.substr(0, 8) << "..., Hash: " << hashedPassword.substr(0, 8) << "...";
    return {hashedPassword, salt};
}

bool PasswordHasher::verifyPassword(const std::string& password, const std::string& storedHash, const std::string& storedSalt) {
    std::string saltedPassword = password + storedSalt;
    std::string hashedPassword = sha256(saltedPassword);
    bool match = (hashedPassword == storedHash);
    if (!match) {
        LOG_WARN << "Password verification failed for a user.";
    }
    return match;
}

} // namespace ApexContent::Utils
```