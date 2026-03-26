```cpp
#include "ProductService.h"

ProductService::ProductService(ProductRepository productRepo) : productRepo(std::move(productRepo)) {}

drogon::Task<std::optional<Product>> ProductService::getProductById(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid product ID format.");
    }
    return productRepo.findById(id);
}

drogon::Task<std::vector<Product>> ProductService::getAllProducts(size_t limit, size_t offset) {
    return productRepo.findAll(limit, offset);
}

drogon::Task<Product> ProductService::createProduct(const std::string& name,
                                                    const std::string& description,
                                                    double price,
                                                    int stockQuantity) {
    if (name.empty() || description.empty() || price <= 0 || stockQuantity < 0) {
        throw Common::ApiException(400, "Invalid product data. Name, description, positive price, and non-negative stock required.");
    }

    if (co_await productRepo.findByName(name)) {
        throw Common::ApiException(409, "A product with this name already exists.");
    }

    Product newProduct;
    newProduct.name = name;
    newProduct.description = description;
    newProduct.price = price;
    newProduct.stock_quantity = stockQuantity;

    Product createdProduct = co_await productRepo.insert(newProduct);
    LOG_INFO("Product '{}' created successfully (ID: {}).", name, createdProduct.id);
    co_return createdProduct;
}

drogon::Task<Product> ProductService::updateProduct(const UUID& productId,
                                                    std::optional<std::string> updatedName,
                                                    std::optional<std::string> updatedDescription,
                                                    std::optional<double> updatedPrice,
                                                    std::optional<int> updatedStockQuantity) {
    if (!Common::isValidUUID(productId)) {
        throw Common::ApiException(400, "Invalid product ID format.");
    }

    std::optional<Product> productOpt = co_await productRepo.findById(productId);
    if (!productOpt) {
        throw Common::ApiException(404, "Product not found.");
    }
    Product product = productOpt.value();

    if (updatedName && product.name != updatedName.value()) {
        if (co_await productRepo.findByName(updatedName.value())) {
            throw Common::ApiException(409, "Another product with this name already exists.");
        }
        product.name = updatedName.value();
    }
    if (updatedDescription) {
        product.description = updatedDescription.value();
    }
    if (updatedPrice) {
        if (updatedPrice.value() <= 0) {
            throw Common::ApiException(400, "Price must be positive.");
        }
        product.price = updatedPrice.value();
    }
    if (updatedStockQuantity) {
        if (updatedStockQuantity.value() < 0) {
            throw Common::ApiException(400, "Stock quantity cannot be negative.");
        }
        product.stock_quantity = updatedStockQuantity.value();
    }

    Product updatedProduct = co_await productRepo.update(product);
    LOG_INFO("Product {} updated successfully.", productId);
    co_return updatedProduct;
}

drogon::Task<bool> ProductService::deleteProduct(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid product ID format.");
    }

    bool deleted = co_await productRepo.remove(id);
    if (!deleted) {
        throw Common::ApiException(404, "Product not found.");
    }
    LOG_INFO("Product {} deleted successfully.", id);
    co_return true;
}
```