```cpp
#ifndef AUTH_SYSTEM_USER_H
#define AUTH_SYSTEM_USER_H

#include <string>
#include <vector>
#include <map>
#include <memory>
#include "../database/Database.h"

// Custom exception for user-related errors
class UserException : public std::runtime_error {
public:
    explicit UserException(const std::string& message) : std::runtime_error(message) {}
};

class User {
public:
    // Constructors
    User(); // Default constructor
    explicit User(std::shared_ptr<Database> db);
    User(const std::string& id, const std::string& username, const std::string& email, 
         const std::string& passwordHash, const std::string& createdAt, const std::string& updatedAt,
         bool isDeleted, std::shared_ptr<Database> db);

    // Getters
    const std::string& getId() const;
    const std::string& getUsername() const;
    const std::string& getEmail() const;
    const std::string& getPasswordHash() const;
    const std::string& getCreatedAt() const;
    const std::string& getUpdatedAt() const;
    bool getIsDeleted() const;

    // Setters
    void setUsername(const std::string& username);
    void setEmail(const std::string& email);
    void setPasswordHash(const std::string& passwordHash);
    void setIsDeleted(bool isDeleted);

    // Database operations
    bool findById(const std::string& id);
    bool findByEmail(const std::string& email);
    bool create();
    bool update();
    bool softDelete();

    // Helper to generate a new UUID
    static std::string generateUuid();

private:
    std::string id_;
    std::string username_;
    std::string email_;
    std::string password_hash_;
    std::string created_at_;
    std::string updated_at_;
    bool is_deleted_;

    std::shared_ptr<Database> db_;

    // Private helper to populate user data from a database row
    void fromDbRow(const std::map<std::string, std::string>& row);
};

#endif // AUTH_SYSTEM_USER_H
```