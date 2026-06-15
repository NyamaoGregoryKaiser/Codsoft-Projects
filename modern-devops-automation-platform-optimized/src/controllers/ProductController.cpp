```cpp
#include "ProductController.h"
#include "../utils/Logger.h"
#include <drogon/drogon.h>
#include <Poco/JSON/Parser.h>
#include <Poco/Dynamic/Var.h>

using namespace drogon;
using namespace AppControllers;

// Helper to check for admin role (for authorization)
bool isUserAdmin(const HttpRequestPtr &req) {
    auto userInfo = drogon::filter::AuthMiddleware::getUserInfo(req);
    if (userInfo && userInfo->has("isAdmin")) {
        return userInfo->getValue<std::string>("isAdmin") == "true";
    }
    return false;
}

// --- CRUD Operations for Products ---

void ProductController::createProduct(const HttpRequestPtr &req,
                                     std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Received request to create product.";

    if (!isUserAdmin(req)) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k403Forbidden);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Forbidden");
        errJson.set("message", "Only administrators can create products.");
        resp->setBody(errJson.toString());
        callback(resp);
        return;
    }

    try {
        Poco::JSON::Parser parser;
        Poco::Dynamic::Var result = parser.parse(req->body());
        Poco::JSON::Object::Ptr productJson = result.extract<Poco::JSON::Object::Ptr>();

        // Basic validation
        if (!productJson->has("name") || !productJson->has("price") || !productJson->has("stock")) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k400BadRequest);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            Poco::JSON::Object errJson;
            errJson.set("error", "Bad Request");
            errJson.set("message", "Missing required fields: name, price, stock.");
            resp->setBody(errJson.toString());
            callback(resp);
            return;
        }

        productService_.createProduct(productJson).then([callback](const AppModels::Product& newProduct) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k201Created);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            resp->setBody(newProduct.toJson()->toString());
            callback(resp);
        }).except([callback](const std::exception& e) {
            // Exceptions are typically caught by ErrorHandlingMiddleware
            // but if specific error codes are needed here, we can handle them.
            // For now, re-throw to let ErrorHandlingMiddleware handle it.
            throw;
        });

    } catch (const Poco::Exception& e) {
        LOG_ERROR << "JSON parsing error: " << e.displayText();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Invalid JSON");
        errJson.set("message", e.displayText());
        resp->setBody(errJson.toString());
        callback(resp);
    }
}

void ProductController::getProductById(const HttpRequestPtr &req,
                                      std::function<void(const HttpResponsePtr &)> &&callback,
                                      std::string id) {
    LOG_INFO << "Received request to get product by ID: " << id;

    productService_.getProductById(id).then([callback](const std::optional<AppModels::Product>& product) {
        if (product) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k200OK);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            resp->setBody(product->toJson()->toString());
            callback(resp);
        } else {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k404NotFound);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            Poco::JSON::Object errJson;
            errJson.set("error", "Not Found");
            errJson.set("message", "Product not found with ID: " + id);
            resp->setBody(errJson.toString());
            callback(resp);
        }
    }).except([callback](const std::exception& e) {
        throw;
    });
}

void ProductController::getAllProducts(const HttpRequestPtr &req,
                                      std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Received request to get all products.";

    productService_.getAllProducts().then([callback](const std::vector<AppModels::Product>& products) {
        Poco::JSON::Array jsonArray;
        for (const auto& product : products) {
            jsonArray.add(product.toJson());
        }
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k200OK);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        resp->setBody(jsonArray.toString());
        callback(resp);
    }).except([callback](const std::exception& e) {
        throw;
    });
}

void ProductController::updateProduct(const HttpRequestPtr &req,
                                     std::function<void(const HttpResponsePtr &)> &&callback,
                                     std::string id) {
    LOG_INFO << "Received request to update product ID: " << id;

    if (!isUserAdmin(req)) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k403Forbidden);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Forbidden");
        errJson.set("message", "Only administrators can update products.");
        resp->setBody(errJson.toString());
        callback(resp);
        return;
    }

    try {
        Poco::JSON::Parser parser;
        Poco::Dynamic::Var result = parser.parse(req->body());
        Poco::JSON::Object::Ptr productJson = result.extract<Poco::JSON::Object::Ptr>();

        productService_.updateProduct(id, productJson).then([id, callback](const std::optional<AppModels::Product>& updatedProduct) {
            if (updatedProduct) {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k200OK);
                resp->setContentTypeCode(CT_APPLICATION_JSON);
                resp->setBody(updatedProduct->toJson()->toString());
                callback(resp);
            } else {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k404NotFound);
                resp->setContentTypeCode(CT_APPLICATION_JSON);
                Poco::JSON::Object errJson;
                errJson.set("error", "Not Found");
                errJson.set("message", "Product not found with ID: " + id + " for update.");
                resp->setBody(errJson.toString());
                callback(resp);
            }
        }).except([callback](const std::exception& e) {
            throw;
        });

    } catch (const Poco::Exception& e) {
        LOG_ERROR << "JSON parsing error for update: " << e.displayText();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Invalid JSON");
        errJson.set("message", e.displayText());
        resp->setBody(errJson.toString());
        callback(resp);
    }
}

void ProductController::deleteProduct(const HttpRequestPtr &req,
                                     std::function<void(const HttpResponsePtr &)> &&callback,
                                     std::string id) {
    LOG_INFO << "Received request to delete product ID: " << id;

    if (!isUserAdmin(req)) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k403Forbidden);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Forbidden");
        errJson.set("message", "Only administrators can delete products.");
        resp->setBody(errJson.toString());
        callback(resp);
        return;
    }

    productService_.deleteProduct(id).then([id, callback](bool success) {
        if (success) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k204NoContent); // No content on successful deletion
            callback(resp);
        } else {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k404NotFound);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            Poco::JSON::Object errJson;
            errJson.set("error", "Not Found");
            errJson.set("message", "Product not found with ID: " + id + " for deletion.");
            resp->setBody(errJson.toString());
            callback(resp);
        }
    }).except([callback](const std::exception& e) {
        throw;
    });
}

// --- Authentication ---

void ProductController::login(const HttpRequestPtr &req,
                             std::function<void(const HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Received request to login.";

    try {
        Poco::JSON::Parser parser;
        Poco::Dynamic::Var result = parser.parse(req->body());
        Poco::JSON::Object::Ptr loginJson = result.extract<Poco::JSON::Object::Ptr>();

        // Basic validation
        if (!loginJson->has("username") || !loginJson->has("password")) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k400BadRequest);
            resp->setContentTypeCode(CT_APPLICATION_JSON);
            Poco::JSON::Object errJson;
            errJson.set("error", "Bad Request");
            errJson.set("message", "Missing required fields: username, password.");
            resp->setBody(errJson.toString());
            callback(resp);
            return;
        }

        std::string username = loginJson->getValue<std::string>("username");
        std::string password = loginJson->getValue<std::string>("password");

        productService_.authenticateUser(username, password).then([callback](const std::optional<std::string>& token) {
            if (token) {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k200OK);
                resp->setContentTypeCode(CT_APPLICATION_JSON);
                Poco::JSON::Object authResp;
                authResp.set("token", *token);
                authResp.set("message", "Authentication successful.");
                resp->setBody(authResp.toString());
                callback(resp);
            } else {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k401Unauthorized);
                resp->setContentTypeCode(CT_APPLICATION_JSON);
                Poco::JSON::Object errJson;
                errJson.set("error", "Unauthorized");
                errJson.set("message", "Invalid username or password.");
                resp->setBody(errJson.toString());
                callback(resp);
            }
        }).except([callback](const std::exception& e) {
            throw;
        });

    } catch (const Poco::Exception& e) {
        LOG_ERROR << "JSON parsing error for login: " << e.displayText();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Invalid JSON");
        errJson.set("message", e.displayText());
        resp->setBody(errJson.toString());
        callback(resp);
    }
}
```