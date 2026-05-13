```cpp
#include "ProductService.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <format> // C++20 for std::format

namespace services
{
    ProductService::ProductService(std::shared_ptr<dao::ProductDAO> productDAO)
        : productDAO_(std::move(productDAO))
    {
        LOG_INFO("ProductService initialized.");
    }

    std::future<models::Product> ProductService::createProduct(const models::ProductRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid product data provided.", "INVALID_PRODUCT_DATA");
        }

        models::Product newProduct;
        newProduct.name = request.name;
        newProduct.description = request.description;
        newProduct.price = request.price;
        newProduct.stockQuantity = request.stockQuantity;

        return productDAO_->create(newProduct)
            .then([](models::Product createdProduct) {
                LOG_INFO("Product '{}' created successfully with ID: {}", createdProduct.name, createdProduct.id);
                return createdProduct;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error during product creation: {}", e.what());
                    throw api::ApiException(std::format("Failed to create product: {}", e.what()), drogon::k500InternalServerError, "PRODUCT_CREATION_FAILED");
                }
                return models::Product();
            });
    }

    std::future<models::Product> ProductService::getProductById(const std::string &productId)
    {
        return productDAO_->findById(productId)
            .then([productId](std::optional<models::Product> productOpt) {
                if (!productOpt)
                {
                    LOG_WARN("Product with ID '{}' not found.", productId);
                    throw api::NotFoundException(std::format("Product with ID '{}' not found.", productId), "PRODUCT_NOT_FOUND");
                }
                LOG_INFO("Retrieved product with ID: {}", productId);
                return *productOpt;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving product by ID: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve product: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_PRODUCT_FAILED");
                }
                return models::Product();
            });
    }

    std::future<models::Product> ProductService::updateProduct(const std::string &productId, const models::ProductRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid product data provided for update.", "INVALID_PRODUCT_UPDATE_DATA");
        }

        return productDAO_->findById(productId)
            .then([this, productId, request](std::optional<models::Product> productOpt) {
                if (!productOpt)
                {
                    LOG_WARN("Update attempt for product ID '{}': Product not found.", productId);
                    throw api::NotFoundException(std::format("Product with ID '{}' not found for update.", productId), "PRODUCT_NOT_FOUND");
                }

                models::Product product = *productOpt;
                product.name = request.name;
                product.description = request.description;
                product.price = request.price;
                product.stockQuantity = request.stockQuantity;
                product.id = productId; // Ensure ID is set for update operation

                return productDAO_->update(product);
            })
            .then([](models::Product updatedProduct) {
                LOG_INFO("Product with ID '{}' updated successfully.", updatedProduct.id);
                return updatedProduct;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error updating product: {}", e.what());
                    throw api::ApiException(std::format("Failed to update product: {}", e.what()), drogon::k500InternalServerError, "UPDATE_PRODUCT_FAILED");
                }
                return models::Product();
            });
    }

    std::future<bool> ProductService::deleteProduct(const std::string &productId)
    {
        return productDAO_->remove(productId)
            .then([productId](bool deleted) {
                if (!deleted)
                {
                    LOG_WARN("Delete attempt for product ID '{}': Product not found.", productId);
                    throw api::NotFoundException(std::format("Product with ID '{}' not found for deletion.", productId), "PRODUCT_NOT_FOUND");
                }
                LOG_INFO("Product with ID '{}' deleted successfully.", productId);
                return true;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error deleting product: {}", e.what());
                    throw api::ApiException(std::format("Failed to delete product: {}", e.what()), drogon::k500InternalServerError, "DELETE_PRODUCT_FAILED");
                }
                return false;
            });
    }

    std::future<std::vector<models::Product>> ProductService::getAllProducts()
    {
        return productDAO_->findAll()
            .then([](std::vector<models::Product> products) {
                LOG_INFO("Retrieved {} all products.", products.size());
                return products;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving all products: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve all products: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_ALL_PRODUCTS_FAILED");
                }
                return std::vector<models::Product>();
            });
    }

} // namespace services
```