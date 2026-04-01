```cpp
#include "ProductController.h"
#include "utils/JsonUtils.h"
#include "utils/Logger.h"
#include "common/Error.h"

#include <nlohmann/json.hpp>
#include <stdexcept>

void ProductController::createProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        nlohmann::json json_body = nlohmann::json::parse(request.body());
        Product product = json_body.get<Product>();

        Product createdProduct = productService.createProduct(product);
        response.send(Pistache::Http::Code::Created, JsonUtils::toJson(createdProduct).dump());
    } catch (const nlohmann::json::exception& e) {
        LOG_ERROR("JSON parsing error in createProduct: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid JSON format: " + std::string(e.what()));
    } catch (const InputValidationError& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, e.what());
    } catch (const std::exception& e) {
        LOG_ERROR("Error creating product: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Failed to create product.");
    }
}

void ProductController::getProducts(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        auto nameFilter = request.query().has("name") ? std::make_optional(request.query().get("name").get()) : std::nullopt;
        auto categoryId = request.query().has("categoryId") ? std::make_optional(std::stoll(request.query().get("categoryId").get())) : std::nullopt;
        auto manufacturerId = request.query().has("manufacturerId") ? std::make_optional(std::stoll(request.query().get("manufacturerId").get())) : std::nullopt;
        auto minPrice = request.query().has("minPrice") ? std::make_optional(std::stod(request.query().get("minPrice").get())) : std::nullopt;
        auto maxPrice = request.query().has("maxPrice") ? std::make_optional(std::stod(request.query().get("maxPrice").get())) : std::nullopt;
        
        int limit = request.query().has("limit") ? std::stoi(request.query().get("limit").get()) : 10;
        int offset = request.query().has("offset") ? std::stoi(request.query().get("offset").get()) : 0;

        std::vector<Product> products = productService.getProducts(nameFilter, categoryId, manufacturerId, minPrice, maxPrice, limit, offset);
        
        nlohmann::json products_json = nlohmann::json::array();
        for (const auto& p : products) {
            products_json.push_back(JsonUtils::toJson(p));
        }
        response.send(Pistache::Http::Code::Ok, products_json.dump());
    } catch (const std::invalid_argument& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid number format in query parameters.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting products: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Failed to retrieve products.");
    }
}

void ProductController::getProductById(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        long long id = request.param(":id").as<long long>();
        std::optional<Product> product = productService.getProductById(id);

        if (product) {
            response.send(Pistache::Http::Code::Ok, JsonUtils::toJson(*product).dump());
        } else {
            JsonUtils::sendError(response, Pistache::Http::Code::Not_Found, "Product not found.");
        }
    } catch (const std::invalid_argument& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid product ID format.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error getting product by ID: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Failed to retrieve product.");
    }
}

void ProductController::updateProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        long long id = request.param(":id").as<long long>();
        nlohmann::json json_body = nlohmann::json::parse(request.body());
        Product product = json_body.get<Product>();
        product.id = id; // Ensure ID from path is used

        Product updatedProduct = productService.updateProduct(id, product);
        response.send(Pistache::Http::Code::Ok, JsonUtils::toJson(updatedProduct).dump());
    } catch (const nlohmann::json::exception& e) {
        LOG_ERROR("JSON parsing error in updateProduct: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid JSON format: " + std::string(e.what()));
    } catch (const InputValidationError& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, e.what());
    } catch (const NotFoundError& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Not_Found, e.what());
    } catch (const std::invalid_argument& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid product ID format.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error updating product: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Failed to update product.");
    }
}

void ProductController::deleteProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        long long id = request.param(":id").as<long long>();
        productService.deleteProduct(id);
        response.send(Pistache::Http::Code::No_Content);
    } catch (const NotFoundError& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Not_Found, e.what());
    } catch (const std::invalid_argument& e) {
        JsonUtils::sendError(response, Pistache::Http::Code::Bad_Request, "Invalid product ID format.");
    } catch (const std::exception& e) {
        LOG_ERROR("Error deleting product: {}", e.what());
        JsonUtils::sendError(response, Pistache::Http::Code::Internal_Server_Error, "Failed to delete product.");
    }
}
```