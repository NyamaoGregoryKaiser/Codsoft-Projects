```cpp
#include "ProductRepository.h"
#include "../database/DBManager.h"

ProductRepository::ProductRepository(drogon::orm::DbClientPtr client) {
    if (client) {
        dbClient = client;
    } else {
        dbClient = DBManager::getClient();
    }
}

drogon::Task<std::optional<Product>> ProductRepository::findById(const UUID& id) {
    try {
        auto result = co_await dbClient->execSqlCoro("SELECT * FROM products WHERE id = $1", id);
        if (result.empty()) {
            co_return std::nullopt;
        }
        co_return Product::fromDrogonModel(result[0]);
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error finding product by ID {}: {}", id, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<std::optional<Product>> ProductRepository::findByName(const std::string& name) {
    try {
        auto result = co_await dbClient->execSqlCoro("SELECT * FROM products WHERE name = $1", name);
        if (result.empty()) {
            co_return std::nullopt;
        }
        co_return Product::fromDrogonModel(result[0]);
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error finding product by name {}: {}", name, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<Product> ProductRepository::insert(Product product) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "INSERT INTO products (name, description, price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING *",
            product.name, product.description, product.price, product.stock_quantity
        );
        if (result.empty()) {
            LOG_ERROR("Insert product returned no data. Product: {}", product.name);
            throw Common::ApiException(500, "Failed to retrieve product after insertion.");
        }
        co_return Product::fromDrogonModel(result[0]);
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error inserting product {}: {}", product.name, e.what());
        if (std::string(e.what()).find("duplicate key value violates unique constraint") != std::string::npos) {
            throw Common::ApiException(409, "A product with this name already exists.");
        }
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<Product> ProductRepository::update(const Product& product) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4 WHERE id = $5 RETURNING *",
            product.name, product.description, product.price, product.stock_quantity, product.id
        );
        if (result.empty()) {
            LOG_WARN("Product with ID {} not found for update.", product.id);
            throw Common::ApiException(404, "Product not found.");
        }
        co_return Product::fromDrogonModel(result[0]);
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error updating product {}: {}", product.id, e.what());
        if (std::string(e.what()).find("duplicate key value violates unique constraint") != std::string::npos) {
            throw Common::ApiException(409, "Another product with this name already exists.");
        }
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<bool> ProductRepository::remove(const UUID& id) {
    try {
        auto result = co_await dbClient->execSqlCoro("DELETE FROM products WHERE id = $1 RETURNING id", id);
        co_return !result.empty();
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error deleting product {}: {}", id, e.what());
        if (std::string(e.what()).find("foreign key constraint fails") != std::string::npos ||
            std::string(e.what()).find("violates foreign key constraint") != std::string::npos) {
            throw Common::ApiException(409, "Cannot delete product as it is part of an existing order.");
        }
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<std::vector<Product>> ProductRepository::findAll(size_t limit, size_t offset) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "SELECT * FROM products ORDER BY name ASC LIMIT $1 OFFSET $2",
            limit, offset
        );
        std::vector<Product> products;
        for (const auto& row : result) {
            products.push_back(Product::fromDrogonModel(row));
        }
        co_return products;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error retrieving all products: {}", e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}
```