#ifndef AUTH_SYSTEM_PASSWORDHASHER_H
#define AUTH_SYSTEM_PASSWORDHASHER_H

#include <string>

class PasswordHasher {
public:
    // Hashes a plain password using bcrypt. Returns the hashed string.
    static std::string hashPassword(const std::string& plainPassword);

    // Verifies a plain password against a stored hash.
    static bool verifyPassword(const std::string& plainPassword, const std::string& hashedPassword);

private:
    static const int BCRYPT_WORK_FACTOR = 12; // A good balance between security and performance
};

#endif // AUTH_SYSTEM_PASSWORDHASHER_H