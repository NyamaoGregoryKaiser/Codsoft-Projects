```cpp
#include "ProductController.h"

ProductController::ProductController(ProductService productService) : productService(std::move(productService)) {}

void ProductController::getAllProducts(const drogon::HttpRequestPtr& req,
                                       std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                       long limit, long offset) {
    LOG_INFO("Received GET /products request. Limit: {}, Offset: {}", limit, offset);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::vector<Product> products = co_await productService.getAllProducts(limit, offset);

            Json::Value resp_json(Json::arrayValue);
            for (const auto& product : products) {
                resp_json.append(product.toJson());
            }

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in getAllProducts: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void ProductController::getProductById(const drogon::HttpRequestPtr& req,
                                       std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                       const std::string& id) {
    LOG_INFO("Received GET /products/{} request.", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::optional<Product> productOpt = co_await productService.getProductById(id);
            if (!productOpt) {
                throw Common::ApiException(404, "Product not found.");
            }

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(productOpt.value().toJson().toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in getProductById: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void ProductController::createProduct(const drogon::HttpRequestPtr& req,
                                      std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_INFO("Received POST /products request (Admin).");
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            auto json = req->getJsonObject();
            if (!json || !json->isMember("name") || !json->isMember("description") || !json->isMember("price") || !json->isMember("stock_quantity")) {
                throw Common::ApiException(400, "Missing required fields: name, description, price, stock_quantity.");
            }

            std::string name = (*json)["name"].asString();
            std::string description = (*json)["description"].asString();
            double price = (*json)["price"].asDouble();
            int stockQuantity = (*json)["stock_quantity"].asInt();

            Product createdProduct = co_await productService.createProduct(name, description, price, stockQuantity);

            Json::Value resp_json;
            resp_json["message"] = "Product created successfully";
            resp_json["product"] = createdProduct.toJson();

            resp->setStatusCode(drogon::k201Created);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in createProduct: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void ProductController::updateProduct(const drogon::HttpRequestPtr& req,
                                      std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                      const std::string& id) {
    LOG_INFO("Received PATCH /products/{} request (Admin).", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            auto json = req->getJsonObject();
            if (!json) {
                throw Common::ApiException(400, "Invalid JSON payload.");
            }

            std::optional<std::string> name, description;
            std::optional<double> price;
            std::optional<int> stockQuantity;

            if (json->isMember("name")) name = (*json)["name"].asString();
            if (json->isMember("description")) description = (*json)["description"].asString();
            if (json->isMember("price")) price = (*json)["price"].asDouble();
            if (json->isMember("stock_quantity")) stockQuantity = (*json)["stock_quantity"].asInt();

            Product updatedProduct = co_await productService.updateProduct(id, name, description, price, stockQuantity);

            Json::Value resp_json;
            resp_json["message"] = "Product updated successfully";
            resp_json["product"] = updatedProduct.toJson();

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in updateProduct: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void ProductController::deleteProduct(const drogon::HttpRequestPtr& req,
                                      std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                      const std::string& id) {
    LOG_INFO("Received DELETE /products/{} request (Admin).", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            co_await productService.deleteProduct(id);

            resp->setStatusCode(drogon::k204NoContent);
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in deleteProduct: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}
```