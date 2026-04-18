```cpp
#ifndef PERFOMETRICS_USER_H
#define PERFOMETRICS_USER_H

#include <string>
#include <optional>

struct User {
    int id;
    std::string username;
    std::string password_hash; // Store hashed passwords
    std::string role; // e.g., "admin", "viewer"

    // Default constructor for cases where not all fields are known initially
    User() : id(0) {}

    // Constructor for creating a User object from DB data
    User(int id, std::string username, std::string password_hash, std::string role)
        : id(id), username(std::move(username)), password_hash(std::move(password_hash)), role(std::move(role)) {}
};

#endif //PERFOMETRICS_USER_H
```