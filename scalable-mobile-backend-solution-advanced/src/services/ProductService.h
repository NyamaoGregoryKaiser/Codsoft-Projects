```cpp
#pragma once

#include <drogon/drogon.h>
#include <string>
#include <vector>
#include <optional>
#include "../models/Product.h"
#include "../repositories/ProductRepository.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Service for managing product-related business logic.
 *
 * This class provides methods for CRUD operations on products,
 * applying business rules and coordinating with the ProductRepository.
 */
class ProductService {
public:
    /**
     * @brief Constructs a ProductService.
     * @param productRepo The ProductRepository instance.
     */
    explicit ProductService(ProductRepository productRepo = ProductRepository());

    /**
     * @brief Retrieves a product by ID.
     * @param id The UUID of the product.
     * @return An optional Product object if found.
     * @throws Common::ApiException if the product is not found.
     */
    drogon::Task<std::optional<Product>> getProductById(const UUID& id);

    /**
     * @brief Retrieves all products with pagination.
     * @param limit The maximum number of products to retrieve.
     * @param offset The number of products to skip.
     * @return A vector of Product objects.
     */
    drogon::Task<std::vector<Product>> getAllProducts(size_t limit, size_t offset);

    /**
     * @brief Creates a new product.
     * @param name The name of the product.
     * @param description The product description.
     * @param price The price of the product.
     * @param stockQuantity The initial stock quantity.
     * @return The created Product object.
     * @throws Common::ApiException if name is already taken or invalid input.
     */
    drogon::Task<Product> createProduct(const std::string& name,
                                        const std::string& description,
                                        double price,
                                        int stockQuantity);

    /**
     * @brief Updates an existing product's information.
     * @param productId The ID of the product to update.
     * @param updatedName New name (optional).
     * @param updatedDescription New description (optional).
     * @param updatedPrice New price (optional).
     * @param updatedStockQuantity New stock quantity (optional).
     * @return The updated Product object.
     * @throws Common::ApiException if product is not found, name conflict, or invalid input.
     */
    drogon::Task<Product> updateProduct(const UUID& productId,
                                        std::optional<std::string> updatedName,
                                        std::optional<std::string> updatedDescription,
                                        std::optional<double> updatedPrice,
                                        std::optional<int> updatedStockQuantity);

    /**
     * @brief Deletes a product by ID.
     * @param id The UUID of the product to delete.
     * @return True if the product was deleted successfully.
     * @throws Common::ApiException if the product is not found or linked to an order.
     */
    drogon::Task<bool> deleteProduct(const UUID& id);

private:
    ProductRepository productRepo;
};
```