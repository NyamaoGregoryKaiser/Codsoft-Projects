```cpp
#pragma once

#include <drogon/HttpController.h>
#include "../services/ProductService.h"
#include "../middleware/AuthMiddleware.h" // For access to user info

namespace AppControllers {

// Use the path /api/v1/products
class ProductController : public drogon::HttpController<ProductController>
{
public:
    METHOD_LIST_BEGIN
    // Use `AuthMiddleware` for all product endpoints
    // Use `ErrorHandlingMiddleware` to wrap controller logic in try-catch
    // Use `RateLimitingMiddleware` for general rate limiting
    ADD_METHOD_TO(ProductController::createProduct, "/api/v1/products", Post, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::AuthMiddleware", "drogon::filter::RateLimitingMiddleware");
    ADD_METHOD_TO(ProductController::getProductById, "/api/v1/products/{id}", Get, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::AuthMiddleware", "drogon::filter::RateLimitingMiddleware");
    ADD_METHOD_TO(ProductController::getAllProducts, "/api/v1/products", Get, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::AuthMiddleware", "drogon::filter::RateLimitingMiddleware");
    ADD_METHOD_TO(ProductController::updateProduct, "/api/v1/products/{id}", Patch, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::AuthMiddleware", "drogon::filter::RateLimitingMiddleware");
    ADD_METHOD_TO(ProductController::deleteProduct, "/api/v1/products/{id}", Delete, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::AuthMiddleware", "drogon::filter::RateLimitingMiddleware");

    // Login endpoint (no auth filter needed here)
    ADD_METHOD_TO(ProductController::login, "/api/v1/auth/login", Post, "drogon::filter::ErrorHandlingMiddleware", "drogon::filter::RateLimitingMiddleware");
    METHOD_LIST_END

    // API Handlers
    void createProduct(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void getProductById(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        std::string id);

    void getAllProducts(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void updateProduct(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        std::string id);

    void deleteProduct(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        std::string id);

    // Authentication
    void login(const drogon::HttpRequestPtr &req,
               std::function<void(const drogon::HttpResponsePtr &)> &&callback);


private:
    AppServices::ProductService productService_;
};

} // namespace AppControllers
```