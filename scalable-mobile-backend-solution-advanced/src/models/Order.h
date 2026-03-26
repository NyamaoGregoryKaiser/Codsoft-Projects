```cpp
#pragma once

#include <string>
#include <vector>
#include <chrono>
#include <json/json.h>
#include <drogon/orm/Mapper.h>
#include "../utils/Common.h" // For timePointToString

// Use the same UUID type defined in User.h
using UUID = std::string;

/**
 * @brief Represents an OrderItem entity, linking products to orders.
 *
 * This struct maps to the 'order_items' table in the database.
 */
struct OrderItem {
    UUID id;
    UUID order_id;
    UUID product_id;
    std::string product_name; // Denormalized for easier display
    int quantity;
    double price_at_purchase;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // Default constructor
    OrderItem() = default;

    // Parameterized constructor
    OrderItem(const UUID& id, const UUID& orderId, const UUID& productId, const std::string& productName,
              int quantity, double priceAtPurchase, const std::chrono::system_clock::time_point& createdAt,
              const std::chrono::system_clock::time_point& updatedAt)
        : id(id), order_id(orderId), product_id(productId), product_name(productName), quantity(quantity),
          price_at_purchase(priceAtPurchase), created_at(createdAt), updated_at(updatedAt) {}

    /**
     * @brief Converts the OrderItem object to a JSON representation.
     * @return Json::Value representing the OrderItem.
     */
    Json::Value toJson() const {
        Json::Value json;
        json["item_id"] = id;
        json["order_id"] = order_id;
        json["product_id"] = product_id;
        json["product_name"] = product_name;
        json["quantity"] = quantity;
        json["price_at_purchase"] = price_at_purchase;
        json["created_at"] = Common::timePointToString(created_at);
        json["updated_at"] = Common::timePointToString(updated_at);
        return json;
    }

    /**
     * @brief Creates an OrderItem object from a Drogon ORM model result.
     * @param result The Drogon ORM result row.
     * @return An OrderItem struct initialized with data from the model.
     */
    static OrderItem fromDrogonModel(const drogon::orm::Result& result) {
        OrderItem item;
        item.id = result["id"].as<UUID>();
        item.order_id = result["order_id"].as<UUID>();
        item.product_id = result["product_id"].as<UUID>();
        item.quantity = result["quantity"].as<int>();
        item.price_at_purchase = result["price_at_purchase"].as<double>();
        item.created_at = result["created_at"].as<std::chrono::system_clock::time_point>();
        item.updated_at = result["updated_at"].as<std::chrono::system_clock::time_point>();
        // product_name might come from a JOIN query, if not, it will be empty by default
        if (result.hasField("product_name")) {
             item.product_name = result["product_name"].as<std::string>();
        } else {
            item.product_name = ""; // Default empty if not joined
        }
        return item;
    }
};

/**
 * @brief Represents an Order entity in the system.
 *
 * This struct maps to the 'orders' table in the database and includes
 * a list of associated OrderItems.
 */
struct Order {
    UUID id;
    UUID user_id;
    std::chrono::system_clock::time_point order_date;
    double total_amount;
    std::string status; // e.g., "pending", "processed", "shipped", "delivered", "cancelled"
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;
    std::vector<OrderItem> items; // Associated order items

    // Default constructor
    Order() = default;

    // Parameterized constructor
    Order(const UUID& id, const UUID& userId, const std::chrono::system_clock::time_point& orderDate,
          double totalAmount, const std::string& status,
          const std::chrono::system_clock::time_point& createdAt,
          const std::chrono::system_clock::time_point& updatedAt)
        : id(id), user_id(userId), order_date(orderDate), total_amount(totalAmount), status(status),
          created_at(createdAt), updated_at(updatedAt) {}

    /**
     * @brief Converts the Order object to a JSON representation.
     * @return Json::Value representing the Order.
     */
    Json::Value toJson() const {
        Json::Value json;
        json["id"] = id;
        json["user_id"] = user_id;
        json["order_date"] = Common::timePointToString(order_date);
        json["total_amount"] = total_amount;
        json["status"] = status;
        json["created_at"] = Common::timePointToString(created_at);
        json["updated_at"] = Common::timePointToString(updated_at);

        Json::Value items_array(Json::arrayValue);
        for (const auto& item : items) {
            items_array.append(item.toJson());
        }
        json["items"] = items_array;

        return json;
    }

    /**
     * @brief Creates an Order object from a Drogon ORM model result.
     * @param result The Drogon ORM result row.
     * @return An Order struct initialized with data from the model.
     */
    static Order fromDrogonModel(const drogon::orm::Result& result) {
        Order order;
        order.id = result["id"].as<UUID>();
        order.user_id = result["user_id"].as<UUID>();
        order.order_date = result["order_date"].as<std::chrono::system_clock::time_point>();
        order.total_amount = result["total_amount"].as<double>();
        order.status = result["status"].as<std::string>();
        order.created_at = result["created_at"].as<std::chrono::system_clock::time_point>();
        order.updated_at = result["updated_at"].as<std::chrono::system_clock::time_point>();
        return order;
    }
};
```