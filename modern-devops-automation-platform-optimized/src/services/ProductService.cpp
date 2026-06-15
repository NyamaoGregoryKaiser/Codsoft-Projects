```cpp
#include "ProductService.h"
#include "../database/DbClient.h"
#include "../utils/Logger.h"
#include "../utils/Cache.h"
#include "../config/AppConfig.h"
#include "../utils/JwtManager.h"

// For password hashing verification (conceptually, use a real library)
#include <Poco/Crypto/DigestEngine.h>
#include <Poco/Crypto/CipherFactory.h>
#include <Poco/Crypto/Cipher.h>
#include <Poco/Crypto/CipherKey.h>
#include <Poco/MD5Engine.h> // Simplified for example, use bcrypt in production

// For generating UUIDs manually if not relying on DB default
#include <uuid/uuid.h>

namespace AppServices {

ProductService::ProductService()
    : dbClient_(AppDb::DbClient::getInstance().client()) {}

drogon::AsyncTask<AppModels::Product> ProductService::createProduct(const Poco::JSON::Object::Ptr& productJson) {
    std::string name = productJson->getValue<std::string>("name");
    std::string description = productJson->getValue<std::string>("description", "");
    double price = productJson->getValue<double>("price");
    int stock = productJson->getValue<int>("stock");
    std::string category = productJson->getValue<std::string>("category", "");

    // Generate UUID for product ID
    uuid_t uuid;
    uuid_generate_random(uuid);
    char uuid_str[37];
    uuid_unparse_lower(uuid, uuid_str);
    std::string id_str(uuid_str);

    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(
            "INSERT INTO products (id, name, description, price, stock, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            id_str, name, description, price, stock, category
        );

        if (result.empty()) {
            LOG_ERROR << "Failed to create product, no rows returned.";
            throw std::runtime_error("Failed to create product.");
        }
        AppModels::Product newProduct = AppModels::Product::fromDbRow(result[0]);
        LOG_INFO << "Product created with ID: " << newProduct.id;

        // Invalidate relevant cache entries
        AppUtils::Cache::getInstance().remove("product:" + newProduct.id);
        AppUtils::Cache::getInstance().remove("products:all");

        co_return newProduct;

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error creating product: " << e.what();
        // Check for unique constraint violation
        if (std::string(e.what()).find("duplicate key value violates unique constraint \"products_name_key\"") != std::string::npos) {
            throw std::runtime_error("Product with this name already exists.");
        }
        throw; // Re-throw other database errors
    }
}

drogon::AsyncTask<std::optional<AppModels::Product>> ProductService::getProductById(const std::string& id) {
    // Try to get from cache first
    std::string cacheKey = "product:" + id;
    auto cachedProductJson = AppUtils::Cache::getInstance().get(cacheKey);
    if (cachedProductJson) {
        LOG_DEBUG << "Product " << id << " retrieved from cache.";
        AppModels::Product product;
        product.id = (*cachedProductJson)->getValue<std::string>("id");
        product.name = (*cachedProductJson)->getValue<std::string>("name");
        product.description = (*cachedProductJson)->getValue<std::string>("description");
        product.price = (*cachedProductJson)->getValue<double>("price");
        product.stock = (*cachedProductJson)->getValue<int>("stock");
        product.category = (*cachedProductJson)->getValue<std::string>("category");
        product.createdAt = (*cachedProductJson)->getValue<std::string>("createdAt");
        product.updatedAt = (*cachedProductJson)->getValue<std::string>("updatedAt");
        co_return product;
    }

    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(
            "SELECT * FROM products WHERE id = $1", id
        );

        if (result.empty()) {
            LOG_DEBUG << "Product with ID " << id << " not found.";
            co_return std::nullopt;
        }
        AppModels::Product product = AppModels::Product::fromDbRow(result[0]);
        LOG_INFO << "Product retrieved from DB with ID: " << product.id;

        // Cache the retrieved product
        AppUtils::Cache::getInstance().put(cacheKey, product.toJson(),
            std::chrono::seconds(AppConfig::ConfigManager::getInstance().getCacheConfig().productTtlSeconds));

        co_return product;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error getting product by ID: " << e.what();
        throw;
    }
}

drogon::AsyncTask<std::vector<AppModels::Product>> ProductService::getAllProducts() {
    // No caching for all products by default, could be complex.
    // A more advanced cache would involve pagination/filtering keys.
    // For simplicity, directly fetch from DB.

    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(
            "SELECT * FROM products ORDER BY name ASC"
        );

        std::vector<AppModels::Product> products;
        for (const auto& row : result) {
            products.push_back(AppModels::Product::fromDbRow(row));
        }
        LOG_INFO << "Retrieved " << products.size() << " products from DB.";
        co_return products;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error getting all products: " << e.what();
        throw;
    }
}

drogon::AsyncTask<std::optional<AppModels::Product>> ProductService::updateProduct(const std::string& id, const Poco::JSON::Object::Ptr& productJson) {
    // Build SQL update dynamically based on provided fields
    std::string updateSql = "UPDATE products SET updated_at = NOW()";
    std::vector<drogon::orm::FieldType> params;
    std::vector<std::string> paramNames;
    int paramIdx = 1;

    // Use current ID for binding
    params.push_back(id);
    paramNames.push_back("id");

    if (productJson->has("name")) {
        updateSql += ", name = $" + std::to_string(++paramIdx);
        params.push_back(productJson->getValue<std::string>("name"));
    }
    if (productJson->has("description")) {
        updateSql += ", description = $" + std::to_string(++paramIdx);
        params.push_back(productJson->getValue<std::string>("description"));
    }
    if (productJson->has("price")) {
        updateSql += ", price = $" + std::to_string(++paramIdx);
        params.push_back(productJson->getValue<double>("price"));
    }
    if (productJson->has("stock")) {
        updateSql += ", stock = $" + std::to_string(++paramIdx);
        params.push_back(productJson->getValue<int>("stock"));
    }
    if (productJson->has("category")) {
        updateSql += ", category = $" + std::to_string(++paramIdx);
        params.push_back(productJson->getValue<std::string>("category"));
    }

    if (paramIdx == 1) { // No fields to update other than ID
        LOG_WARN << "No update fields provided for product ID: " << id;
        co_return co_await getProductById(id); // Return current product state
    }

    updateSql += " WHERE id = $1 RETURNING *";

    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(updateSql, params);

        if (result.empty()) {
            LOG_WARN << "Product with ID " << id << " not found for update.";
            co_return std::nullopt;
        }
        AppModels::Product updatedProduct = AppModels::Product::fromDbRow(result[0]);
        LOG_INFO << "Product updated with ID: " << updatedProduct.id;

        // Invalidate cache
        AppUtils::Cache::getInstance().remove("product:" + updatedProduct.id);
        AppUtils::Cache::getInstance().remove("products:all");

        co_return updatedProduct;

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error updating product ID " << id << ": " << e.what();
        if (std::string(e.what()).find("duplicate key value violates unique constraint \"products_name_key\"") != std::string::npos) {
            throw std::runtime_error("Product with this name already exists.");
        }
        throw;
    }
}

drogon::AsyncTask<bool> ProductService::deleteProduct(const std::string& id) {
    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(
            "DELETE FROM products WHERE id = $1", id
        );

        long long rowsAffected = result.affectedRows();
        if (rowsAffected > 0) {
            LOG_INFO << "Product deleted with ID: " << id;
            // Invalidate cache
            AppUtils::Cache::getInstance().remove("product:" + id);
            AppUtils::Cache::getInstance().remove("products:all");
            co_return true;
        } else {
            LOG_WARN << "Product with ID " << id << " not found for deletion.";
            co_return false;
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error deleting product ID " << id << ": " << e.what();
        throw;
    }
}

drogon::AsyncTask<std::optional<std::string>> ProductService::authenticateUser(const std::string& username, const std::string& password) {
    try {
        drogon::orm::Result result = co_await dbClient_.execSqlCoro(
            "SELECT id, username, password_hash, is_admin FROM users WHERE username = $1", username
        );

        if (result.empty()) {
            LOG_WARN << "Authentication failed for user: " << username << " (user not found)";
            co_return std::nullopt; // User not found
        }

        auto row = result[0];
        std::string storedPasswordHash = row["password_hash"].as<std::string>();
        std::string userId = row["id"].as<std::string>();
        bool isAdmin = row["is_admin"].as<bool>();

        // IMPORTANT: In a real application, use a strong password hashing library like bcrypt.
        // For demonstration, we'll simulate a check.
        // You would typically use a function like bcrypt_checkpw(password.c_str(), storedPasswordHash.c_str())
        // For this example, if the stored hash is "hashed_admin_password" or "hashed_user_password"
        // and the input password matches "adminpass" or "userpass" respectively, we consider it valid.
        // THIS IS NOT SECURE FOR PRODUCTION.

        // Simulate password check (DO NOT USE IN PRODUCTION)
        bool passwordMatches = false;
        if (password == "adminpass" && storedPasswordHash == "$2a$10$wN2J.oX2Q0wS.xR/C9hVduzM.S4o9/L2a/e5f.1z5o.X0K9j/O0K") { // Simplified comparison
             passwordMatches = true;
        } else if (password == "userpass" && storedPasswordHash == "$2a$10$wN2J.oX2Q0wS.xR/C9hVduzM.S4o9/L2a/e5f.1z5o.X0K9j/O0K") {
             passwordMatches = true;
        } else {
            LOG_WARN << "Authentication failed for user: " << username << " (password mismatch)";
        }


        if (passwordMatches) {
            LOG_INFO << "User " << username << " authenticated successfully.";
            // Generate JWT
            std::map<std::string, std::string> claims;
            claims["userId"] = userId;
            claims["username"] = username;
            claims["isAdmin"] = isAdmin ? "true" : "false";
            std::string token = AppUtils::JwtManager::getInstance().generateToken(claims);
            co_return token;
        } else {
            co_return std::nullopt; // Password incorrect
        }

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "Database error during authentication for user " << username << ": " << e.what();
        throw;
    }
}


} // namespace AppServices
```