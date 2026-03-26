```cpp
#include "UserService.h"

UserService::UserService(UserRepository userRepo) : userRepo(std::move(userRepo)) {}

drogon::Task<std::optional<User>> UserService::getUserById(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid user ID format.");
    }
    return userRepo.findById(id);
}

drogon::Task<std::vector<User>> UserService::getAllUsers(size_t limit, size_t offset) {
    return userRepo.findAll(limit, offset);
}

drogon::Task<User> UserService::updateUser(const UUID& userId,
                                          std::optional<std::string> updatedUsername,
                                          std::optional<std::string> updatedEmail,
                                          std::optional<std::string> newPassword) {
    if (!Common::isValidUUID(userId)) {
        throw Common::ApiException(400, "Invalid user ID format.");
    }

    std::optional<User> userOpt = co_await userRepo.findById(userId);
    if (!userOpt) {
        throw Common::ApiException(404, "User not found.");
    }
    User user = userOpt.value();

    if (updatedUsername && user.username != updatedUsername.value()) {
        if (co_await userRepo.findByUsername(updatedUsername.value())) {
            throw Common::ApiException(409, "Username already taken.");
        }
        user.username = updatedUsername.value();
    }

    if (updatedEmail && user.email != updatedEmail.value()) {
        if (co_await userRepo.findByEmail(updatedEmail.value())) {
            throw Common::ApiException(409, "Email already taken.");
        }
        user.email = updatedEmail.value();
    }

    if (newPassword) {
        // Here you might want to call AuthService::isPasswordStrong or similar
        // For simplicity, we just hash it.
        std::string hashedPassword = PasswordHasher::hashPassword(newPassword.value());
        if (hashedPassword.empty()) {
            throw Common::ApiException(500, "Failed to hash new password.");
        }
        user.password_hash = hashedPassword;
    }

    User updatedUser = co_await userRepo.update(user);
    LOG_INFO("User {} updated successfully.", userId);
    co_return updatedUser;
}

drogon::Task<bool> UserService::deleteUser(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid user ID format.");
    }
    
    bool deleted = co_await userRepo.remove(id);
    if (!deleted) {
        throw Common::ApiException(404, "User not found.");
    }
    LOG_INFO("User {} deleted successfully.", id);
    co_return true;
}
```