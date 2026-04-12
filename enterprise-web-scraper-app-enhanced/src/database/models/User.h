```cpp
#ifndef USER_H
#define USER_H

#include <string>
#include <optional>
#include <chrono>

namespace Scraper {
namespace Database {
namespace Models {

struct User {
    std::string id; // UUID
    std::string username;
    std::string email;
    std::string password_hash;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;
};

} // namespace Models
} // namespace Database
} // namespace Scraper

#endif // USER_H
```