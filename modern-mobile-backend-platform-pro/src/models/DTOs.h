```cpp
#pragma once

#include <string>
#include <optional>
#include <json/json.h>
#include <vector>

namespace models
{
    // --- Auth DTOs ---

    /**
     * @brief Request body for user registration.
     */
    struct RegisterRequest
    {
        std::string username;
        std::string email;
        std::string password;
        std::optional<std::string> firstName;
        std::optional<std::string> lastName;

        // Validation for DTOs would typically be here or in service layer.
        // For simplicity, we assume some basic validation.
        bool isValid() const {
            return !username.empty() && !email.empty() && !password.empty();
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("username") && json["username"].isString()) username = json["username"].asString();
            if (json.isMember("email") && json["email"].isString()) email = json["email"].asString();
            if (json.isMember("password") && json["password"].isString()) password = json["password"].asString();
            if (json.isMember("firstName") && json["firstName"].isString()) firstName = json["firstName"].asString();
            if (json.isMember("lastName") && json["lastName"].isString()) lastName = json["lastName"].asString();
        }
    };

    /**
     * @brief Request body for user login.
     */
    struct LoginRequest
    {
        std::string emailOrUsername;
        std::string password;

        bool isValid() const {
            return !emailOrUsername.empty() && !password.empty();
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("emailOrUsername") && json["emailOrUsername"].isString()) emailOrUsername = json["emailOrUsername"].asString();
            if (json.isMember("password") && json["password"].isString()) password = json["password"].asString();
        }
    };

    /**
     * @brief Response body for successful login.
     */
    struct LoginResponse
    {
        std::string token;
        std::string userId;
        std::string username;
        std::string email;

        Json::Value toJson() const {
            Json::Value json;
            json["token"] = token;
            json["userId"] = userId;
            json["username"] = username;
            json["email"] = email;
            return json;
        }
    };

    // --- User DTOs ---

    /**
     * @brief Request body for updating user profile.
     */
    struct UpdateUserRequest
    {
        std::optional<std::string> username;
        std::optional<std::string> email;
        std::optional<std::string> firstName;
        std::optional<std::string> lastName;
        std::optional<std::string> password; // For password change

        bool isEmpty() const {
            return !username && !email && !firstName && !lastName && !password;
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("username") && json["username"].isString()) username = json["username"].asString();
            if (json.isMember("email") && json["email"].isString()) email = json["email"].asString();
            if (json.isMember("firstName") && json["firstName"].isString()) firstName = json["firstName"].asString();
            if (json.isMember("lastName") && json["lastName"].isString()) lastName = json["lastName"].asString();
            if (json.isMember("password") && json["password"].isString()) password = json["password"].asString();
        }
    };

    // --- Product DTOs ---

    /**
     * @brief Request body for creating or updating a product.
     */
    struct ProductRequest
    {
        std::string name;
        std::optional<std::string> description;
        double price;
        int stockQuantity;

        bool isValid() const {
            return !name.empty() && price > 0 && stockQuantity >= 0;
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("name") && json["name"].isString()) name = json["name"].asString();
            if (json.isMember("description") && json["description"].isString()) description = json["description"].asString();
            if (json.isMember("price") && json["price"].isDouble()) price = json["price"].asDouble();
            if (json.isMember("stockQuantity") && json["stockQuantity"].isInt()) stockQuantity = json["stockQuantity"].asInt();
        }
    };

    // --- Order DTOs ---

    /**
     * @brief Item details for placing an order.
     */
    struct PlaceOrderItem
    {
        std::string productId;
        int quantity;

        bool isValid() const {
            return !productId.empty() && quantity > 0;
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("productId") && json["productId"].isString()) productId = json["productId"].asString();
            if (json.isMember("quantity") && json["quantity"].isInt()) quantity = json["quantity"].asInt();
        }
    };

    /**
     * @brief Request body for placing a new order.
     */
    struct PlaceOrderRequest
    {
        std::vector<PlaceOrderItem> items;
        std::optional<std::string> shippingAddress;

        bool isValid() const {
            return !items.empty() && std::all_of(items.begin(), items.end(), [](const PlaceOrderItem& item){ return item.isValid(); });
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("shippingAddress") && json["shippingAddress"].isString()) shippingAddress = json["shippingAddress"].asString();
            if (json.isMember("items") && json["items"].isArray()) {
                for (const auto& itemJson : json["items"]) {
                    PlaceOrderItem item;
                    item.fromJson(itemJson);
                    items.push_back(item);
                }
            }
        }
    };

    /**
     * @brief Request body for updating order status.
     */
    struct UpdateOrderStatusRequest
    {
        std::string status;

        bool isValid() const {
            return !status.empty();
        }

        void fromJson(const Json::Value& json) {
            if (json.isMember("status") && json["status"].isString()) status = json["status"].asString();
        }
    };

} // namespace models
```