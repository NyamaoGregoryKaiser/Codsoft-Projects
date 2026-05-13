```cpp
#pragma once

#include <string>
#include <optional>
#include <chrono>
#include <drogon/orm/Field.h>
#include <json/json.h> // For Json::Value

namespace models
{
    /**
     * @brief Represents a Product entity.
     */
    struct Product
    {
        std::string id;
        std::string name;
        std::optional<std::string> description;
        double price;
        int stockQuantity;
        std::chrono::system_clock::time_point createdAt;
        std::chrono::system_clock::time_point updatedAt;

        /**
         * @brief Converts the Product object to a JSON representation.
         * @return Json::Value representing the product.
         */
        Json::Value toJson() const
        {
            Json::Value json;
            json["id"] = id;
            json["name"] = name;
            if (description)
                json["description"] = *description;
            json["price"] = price;
            json["stockQuantity"] = stockQuantity;
            json["createdAt"] = drogon::orm::Field<drogon::orm::time_point>(createdAt).asSqlString();
            json["updatedAt"] = drogon::orm::Field<drogon::orm::time_point>(updatedAt).asSqlString();
            return json;
        }

        /**
         * @brief Fills the Product object from a Drogon SQL row.
         * @param row The Drogon Row object.
         */
        void fromSqlRow(const drogon::orm::Row &row)
        {
            id = row["id"].as<std::string>();
            name = row["name"].as<std::string>();
            description = row["description"].as<std::optional<std::string>>();
            price = row["price"].as<double>();
            stockQuantity = row["stock_quantity"].as<int>();
            createdAt = row["created_at"].as<std::chrono::system_clock::time_point>();
            updatedAt = row["updated_at"].as<std::chrono::system_clock::time_point>();
        }
    };
} // namespace models
```