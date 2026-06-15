```cpp
#pragma once

#include <string>
#include <drogon/orm/Field.h>
#include <drogon/orm/ResultIterator.h>
#include <Poco/JSON/Object.h>
#include <uuid/uuid.h> // For uuid_t

namespace AppModels {

// Product struct representing a row in the 'products' table
struct Product {
    std::string id;
    std::string name;
    std::string description;
    double price;
    int stock;
    std::string category;
    std::string createdAt; // Stored as ISO 8601 string
    std::string updatedAt; // Stored as ISO 8601 string

    // Convert Product struct to JSON object
    Poco::JSON::Object::Ptr toJson() const;

    // Create Product struct from Drogon's Result row
    static Product fromDbRow(const drogon::orm::ResultIterator::Row& row);
};

} // namespace AppModels
```