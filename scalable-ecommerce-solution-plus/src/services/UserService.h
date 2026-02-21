```cpp
#pragma once

#include "dal/UserDAL.h"
#include "models/User.h"
#include "utils/JwtManager.h"
#include "utils/PasswordHasher.h"
#include "exceptions/ApiException.h"
#include <optional>
#include <future>
#include <string>

namespace ECommerce {
    namespace Services {

        class UserService {
        public:
            UserService(std::shared_ptr<DAL::UserDAL> userDAL, std::shared_ptr<Utils::JwtManager> jwtManager, std::shared_ptr<Utils::PasswordHasher> passwordHasher);

            std::future<std::string> registerUser(const Models::UserRegisterDTO& userDto);
            std::future<std::string> loginUser(const Models::UserLoginDTO& userDto);
            std::future<Models::User> getUserProfile(long userId);
            std::future<Models::User> updateUserProfile(long userId, const Models::User& user);

        private:
            std::shared_ptr<DAL::UserDAL> _userDAL;
            std::shared_ptr<Utils::JwtManager> _jwtManager;
            std::shared_ptr<Utils::PasswordHasher> _passwordHasher;
        };

    }
}
```