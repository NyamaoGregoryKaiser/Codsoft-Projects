```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/Mapper.h>
#include <drogon/orm/DbClient.h>
#include "../models/Product.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Repository for Product data access operations.
 *
 * This class provides methods to perform CRUD operations on the 'products' table.
 */
class ProductRepository {
public:
    /**
     * @brief Constructs a ProductRepository with a database client.
     * @param client The shared pointer to the Drogon DbClient.
     */
    explicit ProductRepository(drogon::orm::DbClientPtr client = nullptr);

    /**
     * @brief Finds a product by its ID.
     * @param id The UUID of the product.
     * @return An optional Product object if found.
     */
    drogon::Task<std::optional<Product>> findById(const UUID& id);

    /**
     * @brief Finds a product by its name.
     * @param name The name of the product.
     * @return An optional Product object if found.
     */
    drogon::Task<std::optional<Product>> findByName(const std::string& name);

    /**
     * @brief Inserts a new product into the database.
     * @param product The Product object to insert.
     * @return The inserted Product object with generated ID and timestamps.
     * @throws Common::ApiException if a database error occurs (e.g., duplicate name).
     */
    drogon::Task<Product> insert(Product product);

    /**
     * @brief Updates an existing product in the database.
     * @param product The Product object with updated fields.
     * @return The updated Product object.
     * @throws Common::ApiException if the product is not found or a database error occurs.
     */
    drogon::Task<Product> update(const Product& product);

    /**
     * @brief Deletes a product from the database by ID.
     * @param id The UUID of the product to delete.
     * @return True if the product was deleted, false if not found.
     * @throws Common::ApiException if a database error occurs (e.g., product linked to an order).
     */
    drogon::Task<bool> remove(const UUID& id);

    /**
     * @brief Retrieves all products with pagination.
     * @param limit The maximum number of products to retrieve.
     * @param offset The number of products to skip.
     * @return A vector of Product objects.
     */
    drogon::Task<std::vector<Product>> findAll(size_t limit, size_t offset);

private:
    drogon::orm::DbClientPtr dbClient;
};
```