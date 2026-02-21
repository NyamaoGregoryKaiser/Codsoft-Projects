```cpp
#pragma once

#include "models/User.h"
#include <drogon/drogon.h>
#include <optional>
#include <future>

namespace ECommerce {
    namespace DAL {

        class UserDAL {
        public:
            // Constructor takes a database client. Drogon manages clients.
            UserDAL(drogon::orm::DbClientPtr dbClient);

            // CRUD operations
            std::future<std::optional<Models::User>> findById(long id);
            std::future<std::optional<Models::User>> findByEmail(const std::string& email);
            std::future<Models::User> createUser(const Models::User& user);
            std::future<Models::User> updateUser(const Models::User& user);
            std::future<void> deleteUser(long id);

        private:
            drogon::orm::DbClientPtr _dbClient;

            Models::User mapRowToUser(const drogon::orm::Row& row);
        };

    }
}
```