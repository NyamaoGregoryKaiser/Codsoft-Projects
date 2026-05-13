```cpp
#pragma once

#include "BaseController.h"
#include "src/services/ProductService.h"
#include <memory>

namespace controllers
{
    /**
     * @brief Controller for product management endpoints.
     * Inherits from BaseController for common utilities and error handling.
     * CRUD operations might have different authorization levels (e.g., admin for create/update/delete).
     */
    class ProductController : public drogon::HttpController<ProductController>, public BaseController
    {
    public:
        /**
         * @brief Constructor for ProductController.
         * @param productService Shared pointer to the ProductService instance.
         */
        explicit ProductController(std::shared_ptr<services::ProductService> productService);

        METHOD_LIST_BEGIN
        // API group "/api/v1/products"
        // Publicly accessible for viewing products
        ADD_METHOD_TO(ProductController::getAllProducts, "/api/v1/products", drogon::Get, {middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(ProductController::getProductById, "/api/v1/products/{id}", drogon::Get, {middleware::ErrorHandlingMiddleware});

        // Requires authentication (and potentially admin role) for modifying products
        ADD_METHOD_TO(ProductController::createProduct, "/api/v1/products", drogon::Post, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(ProductController::updateProduct, "/api/v1/products/{id}", drogon::Put, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(ProductController::deleteProduct, "/api/v1/products/{id}", drogon::Delete, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        METHOD_LIST_END

        /**
         * @brief Handles creating a new product.
         * Requires authentication. (Admin role would be added here in a real app).
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void createProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

        /**
         * @brief Handles retrieving a product by ID.
         * Publicly accessible.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the product to retrieve.
         */
        void getProductById(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Handles updating an existing product.
         * Requires authentication. (Admin role would be added here in a real app).
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the product to update.
         */
        void updateProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Handles deleting a product.
         * Requires authentication. (Admin role would be added here in a real app).
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the product to delete.
         */
        void deleteProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Handles retrieving all products.
         * Publicly accessible.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void getAllProducts(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

    private:
        std::shared_ptr<services::ProductService> productService_;
    };

} // namespace controllers
```