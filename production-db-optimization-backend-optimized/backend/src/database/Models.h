```cpp
#ifndef MODELS_H
#define MODELS_H

#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

// Helper to convert std::optional to JSON null
namespace nlohmann {
    template <typename T>
    struct adl_serializer<std::optional<T>> {
        static void to_json(json& j, const std::optional<T>& opt) {
            if (opt) {
                j = *opt;
            } else {
                j = nullptr;
            }
        }

        static void from_json(const json& j, std::optional<T>& opt) {
            if (j.is_null()) {
                opt = std::nullopt;
            } else {
                opt = j.get<T>();
            }
        }
    };
}

struct User {
    std::optional<long long> id;
    std::string username;
    std::string password_hash; // Stored hash, not plaintext password
    std::optional<std::string> created_at;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(User, id, username, password_hash, created_at)
};

struct Category {
    std::optional<long long> id;
    std::string name;
    std::optional<std::string> description;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Category, id, name, description)
};

struct Manufacturer {
    std::optional<long long> id;
    std::string name;
    std::optional<std::string> country;
    std::optional<std::string> website;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Manufacturer, id, name, country, website)
};

struct Product {
    std::optional<long long> id;
    std::string name;
    std::optional<std::string> description;
    double price;
    std::optional<long long> category_id;
    std::optional<long long> manufacturer_id;
    std::optional<std::string> created_at;

    // Optional: for displaying product with category/manufacturer names
    std::optional<std::string> category_name;
    std::optional<std::string> manufacturer_name;

    NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Product, id, name, description, price, category_id, manufacturer_id, created_at, category_name, manufacturer_name)
};

#endif // MODELS_H
```