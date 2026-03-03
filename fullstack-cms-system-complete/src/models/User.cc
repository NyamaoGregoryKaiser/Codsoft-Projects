```cpp
#include "User.h"
#include "Role.h" // For role definition
#include "UserRole.h" // For join table
#include "utils/Logger.h"
#include <drogon/orm/Mapper.h>

namespace ApexContent::Model {

// Implement custom methods
std::future<std::vector<std::string>> User::getRoles(const drogon::orm::DbClientPtr& dbClient) const {
    // This example uses raw SQL for demonstration, but a Mapper could also be used for UserRole
    std::string sql = "SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1";
    LOG_DEBUG << "Executing SQL to fetch roles for user " << getValueOfUsername() << ": " << sql;

    return dbClient->execSqlAsync(sql, getValueOfId())
        .then([&](const drogon::orm::Result& r){
            std::vector<std::string> roles;
            for (const auto& row : r) {
                roles.push_back(row["name"].as<std::string>());
            }
            LOG_DEBUG << "Found " << roles.size() << " roles for user " << getValueOfUsername();
            return roles;
        })
        .via(drogon::app().get:"dbThreadPool"); // Ensure callback runs on DB thread pool
}

} // namespace ApexContent::Model
```