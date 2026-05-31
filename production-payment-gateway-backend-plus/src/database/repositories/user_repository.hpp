```cpp
#ifndef ZENITH_USER_REPOSITORY_HPP
#define ZENITH_USER_REPOSITORY_HPP

#include <string>
#include <vector>
#include <optional>
#include "../../models/user.hpp"

namespace Zenith {
namespace Database {

class UserRepository {
public:
    std::optional<Models::User> findById(long id);
    std::optional<Models::User> findByEmail(const std::string& email);
    std::optional<Models::User> findByUsername(const std::string& username);
    std::vector<Models::User> findAll();
    long create(const Models::User& user);
    bool update(const Models::User& user);
    bool deleteById(long id);
};

} // namespace Database
} // namespace Zenith

#endif // ZENITH_USER_REPOSITORY_HPP
```