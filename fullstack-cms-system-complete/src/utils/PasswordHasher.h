```cpp
#pragma once

#include <string>
#include <utility> // For std::pair

namespace ApexContent::Utils {

class PasswordHasher {
public:
    // Hashes a password with a randomly generated salt
    static std::pair<std::string, std::string> hashPassword(const std::string& password);

    // Verifies a password against a stored hash and salt
    static bool verifyPassword(const std::string& password, const std::string& storedHash, const std::string& storedSalt);

private:
    static std::string generateSalt(size_t length = 16);
    static std::string sha256(const std::string& str);
};

} // namespace ApexContent::Utils
```