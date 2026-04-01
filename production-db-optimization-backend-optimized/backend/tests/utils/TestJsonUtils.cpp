```cpp
#include <catch2/catch_all.hpp>
#include "utils/JsonUtils.h"
#include "database/Models.h"

TEST_CASE("JsonUtils converts Product to JSON", "[JsonUtils][Product]") {
    Product p;
    p.id = 1;
    p.name = "Test Product";
    p.description = "A product for testing.";
    p.price = 99.99;
    p.category_id = 101;
    p.manufacturer_id = std::nullopt; // Test with optional null
    p.created_at = "2023-01-01T10:00:00Z";

    nlohmann::json j = JsonUtils::toJson(p);

    REQUIRE(j["id"] == 1);
    REQUIRE(j["name"] == "Test Product");
    REQUIRE(j["description"] == "A product for testing.");
    REQUIRE(j["price"] == 99.99);
    REQUIRE(j["category_id"] == 101);
    REQUIRE(j["manufacturer_id"].is_null()); // Check nullopt
    REQUIRE(j["created_at"] == "2023-01-01T10:00:00Z");
}

TEST_CASE("JsonUtils converts JSON to Product", "[JsonUtils][Product]") {
    nlohmann::json j_in = {
        {"name", "New Gadget"},
        {"description", "Shiny new tech."},
        {"price", 150.75},
        {"category_id", 202},
        {"manufacturer_id", 303}
    };

    Product p = j_in.get<Product>();

    REQUIRE_FALSE(p.id.has_value()); // ID should not be set by parsing input
    REQUIRE(p.name == "New Gadget");
    REQUIRE(p.description == "Shiny new tech.");
    REQUIRE(p.price == 150.75);
    REQUIRE(p.category_id == 202);
    REQUIRE(p.manufacturer_id == 303);
}

TEST_CASE("JsonUtils handles missing optional fields during JSON to Product conversion", "[JsonUtils][Product]") {
    nlohmann::json j_in = {
        {"name", "Simple Item"},
        {"price", 10.00}
    };

    Product p = j_in.get<Product>();

    REQUIRE(p.name == "Simple Item");
    REQUIRE(p.price == 10.00);
    REQUIRE_FALSE(p.description.has_value());
    REQUIRE_FALSE(p.category_id.has_value());
    REQUIRE_FALSE(p.manufacturer_id.has_value());
}

TEST_CASE("JsonUtils sends error response", "[JsonUtils][Error]") {
    // This is hard to test directly without a mock Pistache::Http::ResponseWriter.
    // We'd typically mock it to verify `send` was called with correct arguments.
    // For now, we can only test the construction of the error JSON.
    nlohmann::json error_json = nlohmann::json::parse(JsonUtils::createErrorJson("Test error").dump());
    REQUIRE(error_json["error"] == "Test error");
}
```