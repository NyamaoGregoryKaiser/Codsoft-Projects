```cpp
#ifndef ZENITH_USER_SERVICE_HPP
#define ZENITH_USER_SERVICE_HPP

#include "../../models/user.hpp"
#include "../../database/repositories/user_repository.hpp"
#include <string>
#include <optional>
#include <vector>

namespace Zenith {
namespace Services {

// Helper for password hashing (e.g., using Argon2 or BCrypt)
// For this example, a simple mock
namespace Auth {
    std::string hashPassword(const std::string& password);
    bool verifyPassword(const std::string& password, const std::string& hash);
}

class UserService {
public:
    UserService(Database::UserRepository& repo);

    std::optional<Models::User> getUserById(long id);
    std::optional<Models::User> getUserByEmail(const std::string& email);
    std::optional<Models::User> getUserByUsername(const std::string& username);
    std::vector<Models::User> getAllUsers();

    // Returns the ID of the newly created user
    long createUser(const std::string& username, const std::string& email, const std::string& password, const std::string& fullName, const std::string& address, const std::string& phoneNumber, const std::string& role);
    
    // Updates user details, returning true on success
    bool updateUser(long id, const std::string& username, const std::string& email, const std::string& password_hash, const std::string& fullName, const std::string& address, const std::string& phoneNumber, const std::string& role);
    bool deleteUser(long id);

    // Authentication logic
    std::optional<Models::User> authenticateUser(const std::string& email, const std::string& password);

private:
    Database::UserRepository& userRepo_;
};

} // namespace Services
} // namespace Zenith

#endif // ZENITH_USER_SERVICE_HPP
```