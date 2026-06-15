```cpp
#include "Product.h"
#include <Poco/DateTimeFormatter.h>
#include <Poco/DateTimeFormat.h>
#include <Poco/Dynamic/Var.h>

namespace AppModels {

Poco::JSON::Object::Ptr Product::toJson() const {
    Poco::JSON::Object::Ptr json = new Poco::JSON::Object();
    json->set("id", id);
    json->set("name", name);
    json->set("description", description);
    json->set("price", price);
    json->set("stock", stock);
    json->set("category", category);
    json->set("createdAt", createdAt);
    json->set("updatedAt", updatedAt);
    return json;
}

Product Product::fromDbRow(const drogon::orm::ResultIterator::Row& row) {
    Product product;
    product.id = row["id"].as<std::string>();
    product.name = row["name"].as<std::string>();
    product.description = row["description"].as<std::string>();
    product.price = row["price"].as<double>();
    product.stock = row["stock"].as<int>();
    product.category = row["category"].as<std::string>();

    // Drogon's Field::as<std::string>() for TIMESTAMP returns an ISO 8601 string
    product.createdAt = row["created_at"].as<std::string>();
    product.updatedAt = row["updated_at"].as<std::string>();

    return product;
}

} // namespace AppModels
```