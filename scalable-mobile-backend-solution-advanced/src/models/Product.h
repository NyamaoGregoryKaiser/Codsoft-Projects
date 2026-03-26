```cpp
#pragma once

#include <string>
#include <chrono>
#include <json/json.h>
#include <drogon/orm/Mapper.h>
#include "../utils/Common.h" // For timePointToString

// Use the same UUID type defined in User.h
using UUID = std::string;

/**
 * @brief Represents a Product entity in the system.
 *
 * This struct maps to the 'products' table in the database.
 */
struct Product {
    UUID id;
    std::string name;
    std::string description;
    double price;
    int stock_quantity;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // Default constructor
    Product() = default;

    // Parameterized constructor
    Product(const UUID& id, const std::string& name, const std::string& description, double price, int stockQuantity,
            const std::chrono::system_clock::time_point& createdAt, const std::chrono::system_clock::time_point& updatedAt)
        : id(id), name(name), description(description), price(price), stock_quantity(stockQuantity),
          created_at(createdAt), updated_at(updatedAt) {}

    /**
     * @brief Converts the Product object to a JSON representation.
     * @return Json::Value representing the Product.
     */
    Json::Value toJson() const {
        Json::Value json;
        json["id"] = id;
        json["name"] = name;
        json["description"] = description;
        json["price"] = price;
        json["stock_quantity"] = stock_quantity;
        json["created_at"] = Common::timePointToString(created_at);
        json["updated_at"] = Common::timePointToString(updated_at);
        return json;
    }

    /**
     * @brief Creates a Product object from a Drogon ORM model result.
     * @param model The Drogon ORM model for Product.
     * @return A Product struct initialized with data from the model.
     */
    static Product fromDrogonModel(const drogon::orm::Result& result) {
        Product product;
        product.id = result["id"].as<UUID>();
        product.name = result["name"].as<std::string>();
        product.description = result["description"].as<std::string>();
        product.price = result["price"].as<double>();
        product.stock_quantity = result["stock_quantity"].as<int>();
        product.created_at = result["created_at"].as<std::chrono::system_clock::time_point>();
        product.updated_at = result["updated_at"].as<std::chrono::system_clock::time_point>();
        return product;
    }
};
```