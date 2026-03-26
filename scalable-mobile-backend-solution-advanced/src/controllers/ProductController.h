```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include "../services/ProductService.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Controller for Product management endpoints.
 */
class ProductController : public drogon::HttpController<ProductController> {
public:
    // Inject ProductService
    explicit ProductController(ProductService productService = ProductService());

    METHOD_LIST_BEGIN
    // Public routes
    METHOD_ADD(ProductController::getAllProducts, "", drogon::Get, "RateLimitFilter");
    METHOD_ADD(ProductController::getProductById, "/{id}", drogon::Get, "RateLimitFilter");

    // Authenticated routes, require 'admin' role
    METHOD_ADD(ProductController::createProduct, "", drogon::Post, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_ADD(ProductController::updateProduct, "/{id}", drogon::Patch, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_ADD(ProductController::deleteProduct, "/{id}", drogon::Delete, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_LIST_END

    /**
     * @brief Handles GET /products. Retrieves all products with pagination.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param limit Query parameter for page size.
     * @param offset Query parameter for page offset.
     */
    void getAllProducts(const drogon::HttpRequestPtr& req,
                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                        long limit = 10, long offset = 0);

    /**
     * @brief Handles GET /products/{id}. Retrieves a single product by ID.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the product.
     */
    void getProductById(const drogon::HttpRequestPtr& req,
                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                        const std::string& id);

    /**
     * @brief Handles POST /products (Admin Only). Creates a new product.
     * @param req The HTTP request with JSON payload.
     * @param callback The callback to send the response.
     */
    void createProduct(const drogon::HttpRequestPtr& req,
                       std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    /**
     * @brief Handles PATCH /products/{id} (Admin Only). Updates a product's details.
     * @param req The HTTP request with JSON payload.
     * @param callback The callback to send the response.
     * @param id The UUID of the product to update.
     */
    void updateProduct(const drogon::HttpRequestPtr& req,
                       std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                       const std::string& id);

    /**
     * @brief Handles DELETE /products/{id} (Admin Only). Deletes a product.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the product to delete.
     */
    void deleteProduct(const drogon::HttpRequestPtr& req,
                       std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                       const std::string& id);

private:
    ProductService productService;
};
```