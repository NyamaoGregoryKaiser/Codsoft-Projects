```cpp
#include "ProductDAO.h"
#include "src/utils/Logger.h"
#include <format> // C++20 for std::format

namespace dao
{
    ProductDAO::ProductDAO() : BaseDAO("products") {}

    std::future<models::Product> ProductDAO::create(const models::Product &product)
    {
        std::string sql = "INSERT INTO products (name, description, price, stock_quantity) "
                          "VALUES ($1, $2, $3, $4) RETURNING *";
        LOG_DEBUG("SQL: {}", sql);

        auto params = {
            drogon::orm::internal::OptionalType(product.name),
            drogon::orm::internal::OptionalType(product.description),
            drogon::orm::internal::OptionalType(product.price),
            drogon::orm::internal::OptionalType(product.stockQuantity)
        };

        return dbClient_->execSqlAsync(sql, params)
            .then([](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_ERROR("Product creation returned no rows.");
                    throw api::ApiException("Failed to create product", drogon::k500InternalServerError, "PRODUCT_CREATION_FAILED");
                }
                models::Product createdProduct;
                createdProduct.fromSqlRow(result[0]);
                LOG_INFO("Created product with ID: {}", createdProduct.id);
                return createdProduct;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error creating product: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return models::Product(); // Should not reach here
            });
    }

    std::future<std::optional<models::Product>> ProductDAO::findById(const std::string &id)
    {
        std::string sql = "SELECT * FROM products WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([](drogon::orm::Result result) -> std::optional<models::Product> {
                if (result.empty())
                {
                    LOG_DEBUG("Product with ID '{}' not found.", id);
                    return std::nullopt;
                }
                models::Product product;
                product.fromSqlRow(result[0]);
                return product;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding product by ID: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::Product>(); // Should not reach here
            });
    }

    std::future<models::Product> ProductDAO::update(const models::Product &product)
    {
        std::string sql = "UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *";
        LOG_DEBUG("SQL: {}", sql);

        auto params = {
            drogon::orm::internal::OptionalType(product.name),
            drogon::orm::internal::OptionalType(product.description),
            drogon::orm::internal::OptionalType(product.price),
            drogon::orm::internal::OptionalType(product.stockQuantity),
            drogon::orm::internal::OptionalType(product.id)
        };

        return dbClient_->execSqlAsync(sql, params)
            .then([](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_WARN("Update product with ID '{}' affected no rows.", product.id);
                    throw api::NotFoundException(std::format("Product with ID '{}' not found for update.", product.id));
                }
                models::Product updatedProduct;
                updatedProduct.fromSqlRow(result[0]);
                LOG_INFO("Updated product with ID: {}", updatedProduct.id);
                return updatedProduct;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error updating product: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return models::Product(); // Should not reach here
            });
    }

    std::future<bool> ProductDAO::remove(const std::string &id)
    {
        std::string sql = "DELETE FROM products WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([](drogon::orm::Result result) {
                size_t rowsAffected = result.affectedRows();
                if (rowsAffected > 0)
                {
                    LOG_INFO("Deleted product with ID: {}", id);
                    return true;
                }
                LOG_WARN("Delete product with ID '{}' affected no rows (not found).", id);
                return false;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    // Check for foreign key constraint violation
                    if (e.getSqlState() == "23503") { // foreign_key_violation
                        throw api::ConflictException(
                            std::format("Cannot delete product with ID '{}' because it is part of existing orders.", id),
                            "PRODUCT_IN_ORDERS"
                        );
                    }
                    throw api::ApiException(std::format("Database error deleting product: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return false; // Should not reach here
            });
    }

    std::future<std::vector<models::Product>> ProductDAO::findAll()
    {
        std::string sql = "SELECT * FROM products ORDER BY name";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql)
            .then([](drogon::orm::Result result) {
                std::vector<models::Product> products;
                for (const auto &row : result)
                {
                    models::Product product;
                    product.fromSqlRow(row);
                    products.push_back(product);
                }
                LOG_INFO("Found {} products.", products.size());
                return products;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding all products: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::vector<models::Product>(); // Should not reach here
            });
    }

} // namespace dao
```