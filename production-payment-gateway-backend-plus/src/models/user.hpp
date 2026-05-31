```cpp
#ifndef ZENITH_USER_HPP
#define ZENITH_USER_HPP

#include <string>
#include <optional>
#include <chrono>
#include <nlohmann/json.hpp>

namespace Zenith {
namespace Models {

struct User {
    long id = 0;
    std::string username;
    std::string email;
    std::string password_hash; // Stored securely
    std::string full_name;
    std::string address;
    std::string phone_number;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;
    std::string role; // e.g., "admin", "customer"

    // Helper for JSON serialization
    nlohmann::json toJson() const {
        nlohmann::json j;
        j["id"] = id;
        j["username"] = username;
        j["email"] = email;
        j["fullName"] = full_name;
        j["address"] = address;
        j["phoneNumber"] = phone_number;
        // Convert time_point to ISO 8601 string (e.g., "2023-10-27T10:00:00Z")
        // For simplicity, here's a basic conversion. A robust one would use strftime.
        j["createdAt"] = std::chrono::format("%FT%TZ", created_at); // C++20 for chrono::format
        j["updatedAt"] = std::chrono::format("%FT%TZ", updated_at);
        j["role"] = role;
        return j;
    }
};

} // namespace Models
} // namespace Zenith

#endif // ZENITH_USER_HPP
```