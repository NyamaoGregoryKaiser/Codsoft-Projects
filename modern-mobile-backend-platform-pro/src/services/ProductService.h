```cpp
#pragma once

#include "src/dao/ProductDAO.h"
#include "src/models/Product.h"
#include "src/models/DTOs.h"
#include <memory>
#include <string>
#include <vector>
#include <future>

namespace services
{
    /**
     * @brief Service for product management.
     * Handles creating, retrieving, updating, and deleting product data.
     */
    class ProductService
    {
    public:
        /**
         * @brief Constructor for ProductService.
         * @param productDAO Shared pointer to the ProductDAO instance.
         */
        explicit ProductService(std::shared_ptr<dao::ProductDAO> productDAO);

        /**
         * @brief Creates a new product.
         * @param request The product creation request.
         * @return A Future that resolves to the created Product object.
         * @throws api::BadRequestException if input is invalid.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Product> createProduct(const models::ProductRequest &request);

        /**
         * @brief Retrieves a product by ID.
         * @param productId The ID of the product to retrieve.
         * @return A Future that resolves to the Product object.
         * @throws api::NotFoundException if the product is not found.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Product> getProductById(const std::string &productId);

        /**
         * @brief Updates an existing product.
         * @param productId The ID of the product to update.
         * @param request The product update request.
         * @return A Future that resolves to the updated Product object.
         * @throws api::BadRequestException if input is invalid.
         * @throws api::NotFoundException if the product is not found.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Product> updateProduct(const std::string &productId, const models::ProductRequest &request);

        /**
         * @brief Deletes a product by ID.
         * @param productId The ID of the product to delete.
         * @return A Future that resolves to true if deleted.
         * @throws api::NotFoundException if the product is not found.
         * @throws api::ConflictException if the product is linked to existing orders.
         * @throws api::ApiException on other errors.
         */
        std::future<bool> deleteProduct(const std::string &productId);

        /**
         * @brief Retrieves all products.
         * @return A Future that resolves to a vector of Product objects.
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::Product>> getAllProducts();

    private:
        std::shared_ptr<dao::ProductDAO> productDAO_;
    };

} // namespace services
```