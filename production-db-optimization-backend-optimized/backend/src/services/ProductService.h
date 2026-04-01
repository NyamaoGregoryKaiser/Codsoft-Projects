```cpp
#ifndef PRODUCT_SERVICE_H
#define PRODUCT_SERVICE_H

#include "database/Models.h"
#include <vector>
#include <optional>
#include <string>

class ProductService {
public:
    Product createProduct(const Product& product);
    std::optional<Product> getProductById(long long id);
    std::vector<Product> getProducts(
        std::optional<std::string> nameFilter,
        std::optional<long long> categoryId,
        std::optional<long long> manufacturerId,
        std::optional<double> minPrice,
        std::optional<double> maxPrice,
        int limit, int offset
    );
    Product updateProduct(long long id, const Product& product);
    void deleteProduct(long long id);

private:
    // Helper to build dynamic query for products
    std::pair<std::string, std::vector<pqxx::field_conversion::arg>> buildQuery(
        std::optional<std::string> nameFilter,
        std::optional<long long> categoryId,
        std::optional<long long> manufacturerId,
        std::optional<double> minPrice,
        std::optional<double> maxPrice
    );
};

#endif // PRODUCT_SERVICE_H
```