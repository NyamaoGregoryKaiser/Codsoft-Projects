```cpp
#pragma once

#include <string>
#include <optional>
#include <chrono>
#include <vector>
#include <drogon/orm/Field.h>
#include <json/json.h> // For Json::Value

namespace models
{
    /**
     * @brief Represents an Order Item entity.
     */
    struct OrderItem
    {
        std::string id;
        std::string orderId;
        std::string productId;
        int quantity;
        double priceAtPurchase; // Price when the item was added to the order
        std::chrono::system_clock::time_point createdAt;
        std::chrono::system_clock::time_point updatedAt;

        /**
         * @brief Converts the OrderItem object to a JSON representation.
         * @return Json::Value representing the order item.
         */
        Json::Value toJson() const
        {
            Json::Value json;
            json["id"] = id;
            json["orderId"] = orderId;
            json["productId"] = productId;
            json["quantity"] = quantity;
            json["priceAtPurchase"] = priceAtPurchase;
            json["createdAt"] = drogon::orm::Field<drogon::orm::time_point>(createdAt).asSqlString();
            json["updatedAt"] = drogon::orm::Field<drogon::orm::time_point>(updatedAt).asSqlString();
            return json;
        }

        /**
         * @brief Fills the OrderItem object from a Drogon SQL row.
         * @param row The Drogon Row object.
         */
        void fromSqlRow(const drogon::orm::Row &row)
        {
            id = row["id"].as<std::string>();
            orderId = row["order_id"].as<std::string>();
            productId = row["product_id"].as<std::string>();
            quantity = row["quantity"].as<int>();
            priceAtPurchase = row["price_at_purchase"].as<double>();
            createdAt = row["created_at"].as<std::chrono::system_clock::time_point>();
            updatedAt = row["updated_at"].as<std::chrono::system_clock::time_point>();
        }
    };

    /**
     * @brief Represents an Order entity.
     */
    struct Order
    {
        std::string id;
        std::string userId;
        std::chrono::system_clock::time_point orderDate;
        double totalAmount;
        std::string status;
        std::optional<std::string> shippingAddress;
        std::chrono::system_clock::time_point createdAt;
        std::chrono::system_clock::time_point updatedAt;

        std::vector<OrderItem> items; // Associated order items

        /**
         * @brief Converts the Order object to a JSON representation.
         * @param includeItems Whether to include the associated order items in the JSON.
         * @return Json::Value representing the order.
         */
        Json::Value toJson(bool includeItems = false) const
        {
            Json::Value json;
            json["id"] = id;
            json["userId"] = userId;
            json["orderDate"] = drogon::orm::Field<drogon::orm::time_point>(orderDate).asSqlString();
            json["totalAmount"] = totalAmount;
            json["status"] = status;
            if (shippingAddress)
                json["shippingAddress"] = *shippingAddress;
            json["createdAt"] = drogon::orm::Field<drogon::orm::time_point>(createdAt).asSqlString();
            json["updatedAt"] = drogon::orm::Field<drogon::orm::time_point>(updatedAt).asSqlString();

            if (includeItems)
            {
                Json::Value itemsJson(Json::arrayValue);
                for (const auto &item : items)
                {
                    itemsJson.append(item.toJson());
                }
                json["items"] = itemsJson;
            }
            return json;
        }

        /**
         * @brief Fills the Order object from a Drogon SQL row.
         * @param row The Drogon Row object.
         */
        void fromSqlRow(const drogon::orm::Row &row)
        {
            id = row["id"].as<std::string>();
            userId = row["user_id"].as<std::string>();
            orderDate = row["order_date"].as<std::chrono::system_clock::time_point>();
            totalAmount = row["total_amount"].as<double>();
            status = row["status"].as<std::string>();
            shippingAddress = row["shipping_address"].as<std::optional<std::string>>();
            createdAt = row["created_at"].as<std::chrono::system_clock::time_point>();
            updatedAt = row["updated_at"].as<std::chrono::system_clock::time_point>();
        }
    };
} // namespace models
```