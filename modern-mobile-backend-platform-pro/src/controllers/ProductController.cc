```cpp
#include "ProductController.h"
#include "src/models/DTOs.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <json/json.h>

namespace controllers
{
    ProductController::ProductController(std::shared_ptr<services::ProductService> productService)
        : productService_(std::move(productService))
    {
        LOG_INFO("ProductController initialized.");
    }

    void ProductController::createProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        // For a real application, add role-based authorization here (e.g., only ADMIN can create products)
        // std::string requesterUserId = getUserIdFromRequest(req);

        auto json = parseJsonBody(req);
        models::ProductRequest request;
        request.fromJson(json);

        productService_->createProduct(request)
            .then([this, callback](models::Product product) {
                callback(createSuccessResponse(product.toJson(), "Product created successfully.", drogon::k201Created));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void ProductController::getProductById(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        productService_->getProductById(id)
            .then([this, callback](models::Product product) {
                callback(createSuccessResponse(product.toJson(), "Product retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void ProductController::updateProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        // For a real application, add role-based authorization here (e.g., only ADMIN can update products)
        // std::string requesterUserId = getUserIdFromRequest(req);

        auto json = parseJsonBody(req);
        models::ProductRequest request;
        request.fromJson(json);

        productService_->updateProduct(id, request)
            .then([this, callback](models::Product product) {
                callback(createSuccessResponse(product.toJson(), "Product updated successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void ProductController::deleteProduct(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        // For a real application, add role-based authorization here (e.g., only ADMIN can delete products)
        // std::string requesterUserId = getUserIdFromRequest(req);

        productService_->deleteProduct(id)
            .then([this, callback](bool success) {
                (void)success;
                callback(createSuccessResponse({}, "Product deleted successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void ProductController::getAllProducts(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        productService_->getAllProducts()
            .then([this, callback](std::vector<models::Product> products) {
                Json::Value productsJson(Json::arrayValue);
                for (const auto &product : products)
                {
                    productsJson.append(product.toJson());
                }
                callback(createSuccessResponse(productsJson, "All products retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

} // namespace controllers
```