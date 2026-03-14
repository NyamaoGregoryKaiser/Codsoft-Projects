#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <json/json.h>
#include <string>
#include <vector>
#include <optional>
#include <functional>
#include "models/User.h"

// For asynchronous operations
using AuthCallback = std::function<void(const std::pair<User, std::string>&, const std::string&)>;
using UserListCallback = std::function<void(const std::vector<User>&, const std::string&)>;
using UserCallback = std::function<void(const std::optional<User>&, const std::string&)>;
using GenericCallback = std::function<void(bool, const std::string&)>;

class UserService {
public:
    static UserService* getInstance();

    void registerUser(const std::string& username,
                      const std::string& email,
                      const std::string& password,
                      AuthCallback callback);

    void authenticateUser(const std::string& identifier, // username or email
                          const std::string& password,
                          AuthCallback callback);

    void getAllUsers(UserListCallback callback);

    void getUserById(const std::string& id,
                     UserCallback callback);

    void updateUser(const std::string& id,
                    const Json::Value& updates,
                    UserCallback callback);

    void deleteUser(const std::string& id,
                    GenericCallback callback);

private:
    UserService();
    ~UserService() = default;
    UserService(const UserService&) = delete;
    UserService& operator=(const UserService&) = delete;

    drogon::orm::DbClientPtr dbClient;
};