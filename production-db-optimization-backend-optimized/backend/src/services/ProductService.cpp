```cpp
#include "ProductService.h"
#include "database/Database.h"
#include "utils/Logger.h"
#include "common/Error.h"

#include <stdexcept>
#include <sstream>

Product ProductService::createProduct(const Product& product) {
    if (product.name.empty() || product.price <= 0) {
        throw InputValidationError("Product name cannot be empty and price must be positive.");
    }

    return Database::executeTransaction([&](pqxx::work& txn) {
        std::string sql = R"(
            INSERT INTO products (name, description, price, category_id, manufacturer_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, description, price, category_id, manufacturer_id, created_at;
        )";
        pqxx::result r = txn.exec_params(
            sql,
            product.name,
            product.description,
            product.price,
            product.category_id,
            product.manufacturer_id
        );

        if (r.empty()) {
            throw DatabaseError("Failed to create product.");
        }

        const auto& row = r[0];
        Product newProduct;
        newProduct.id = row["id"].as<long long>();
        newProduct.name = row["name"].as<std::string>();
        newProduct.description = row["description"].as<std::optional<std::string>>();
        newProduct.price = row["price"].as<double>();
        newProduct.category_id = row["category_id"].as<std::optional<long long>>();
        newProduct.manufacturer_id = row["manufacturer_id"].as<std::optional<long long>>();
        newProduct.created_at = row["created_at"].as<std::optional<std::string>>();

        LOG_INFO("Product created with ID: {}", newProduct.id.value_or(-1));
        return newProduct;
    });
}

std::optional<Product> ProductService::getProductById(long long id) {
    auto conn = Database::getConnection();
    pqxx::nontransaction w(*conn); // Read-only operation, no transaction needed
    std::string sql = R"(
        SELECT p.id, p.name, p.description, p.price, p.category_id, p.manufacturer_id, p.created_at,
               c.name AS category_name, m.name AS manufacturer_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
        WHERE p.id = $1;
    )";
    pqxx::result r = w.exec_params(sql, id);
    Database::releaseConnection(conn);

    if (r.empty()) {
        LOG_WARN("Product with ID {} not found.", id);
        return std::nullopt;
    }

    const auto& row = r[0];
    Product product;
    product.id = row["id"].as<long long>();
    product.name = row["name"].as<std::string>();
    product.description = row["description"].as<std::optional<std::string>>();
    product.price = row["price"].as<double>();
    product.category_id = row["category_id"].as<std::optional<long long>>();
    product.manufacturer_id = row["manufacturer_id"].as<std::optional<long long>>();
    product.created_at = row["created_at"].as<std::optional<std::string>>();
    product.category_name = row["category_name"].as<std::optional<std::string>>();
    product.manufacturer_name = row["manufacturer_name"].as<std::optional<std::string>>();

    return product;
}

std::pair<std::string, std::vector<pqxx::field_conversion::arg>> ProductService::buildQuery(
    std::optional<std::string> nameFilter,
    std::optional<long long> categoryId,
    std::optional<long long> manufacturerId,
    std::optional<double> minPrice,
    std::optional<double> maxPrice
) {
    std::ostringstream sql_stream;
    sql_stream << R"(
        SELECT p.id, p.name, p.description, p.price, p.category_id, p.manufacturer_id, p.created_at,
               c.name AS category_name, m.name AS manufacturer_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
    )";

    std::vector<std::string> conditions;
    std::vector<pqxx::field_conversion::arg> params;
    int param_idx = 1;

    if (nameFilter) {
        conditions.push_back("p.name ILIKE $" + std::to_string(param_idx++));
        params.push_back("%" + *nameFilter + "%");
    }
    if (categoryId) {
        conditions.push_back("p.category_id = $" + std::to_string(param_idx++));
        params.push_back(*categoryId);
    }
    if (manufacturerId) {
        conditions.push_back("p.manufacturer_id = $" + std::to_string(param_idx++));
        params.push_back(*manufacturerId);
    }
    if (minPrice) {
        conditions.push_back("p.price >= $" + std::to_string(param_idx++));
        params.push_back(*minPrice);
    }
    if (maxPrice) {
        conditions.push_back("p.price <= $" + std::to_string(param_idx++));
        params.push_back(*maxPrice);
    }

    if (!conditions.empty()) {
        sql_stream << " WHERE " << conditions[0];
        for (size_t i = 1; i < conditions.size(); ++i) {
            sql_stream << " AND " << conditions[i];
        }
    }

    sql_stream << " ORDER BY p.name ASC "; // Default sorting for consistency

    return {sql_stream.str(), params};
}


std::vector<Product> ProductService::getProducts(
    std::optional<std::string> nameFilter,
    std::optional<long long> categoryId,
    std::optional<long long> manufacturerId,
    std::optional<double> minPrice,
    std::optional<double> maxPrice,
    int limit, int offset
) {
    std::vector<Product> products;
    auto conn = Database::getConnection();
    pqxx::nontransaction w(*conn);

    auto query_parts = buildQuery(nameFilter, categoryId, manufacturerId, minPrice, maxPrice);
    std::string sql = query_parts.first + " LIMIT $" + std::to_string(query_parts.second.size() + 1) +
                      " OFFSET $" + std::to_string(query_parts.second.size() + 2) + ";";
    
    query_parts.second.push_back(limit);
    query_parts.second.push_back(offset);

    pqxx::result r;
    // For exec_params with vector of args, you need to use a specific overload or unpack
    // Let's manually unpack the vector for demonstration. In real code, a helper might be used.
    // This part shows why a dedicated ORM or helper for dynamic queries is useful.
    // For this example, let's assume max 10 parameters and write it out.
    // A more robust solution would involve a loop and `txn.exec_params_n`.
    // Given the difficulty of variadic templates for `exec_params`, we'll simplify and show how
    // the query string and parameters would be built, but not execute with variable number of params
    // using the `exec_params` direct overload easily.
    // For demonstration, we'll re-do this with a fixed set of optional parameters.

    // A more practical approach for dynamic params with pqxx without a heavy ORM:
    // Construct the query with placeholder numbers as `pqxx::params::make` expects arguments.
    // This is typically handled by passing to `work.exec_params` directly using `operator<<`.
    // Let's reconstruct the call using `pqxx::params::make` for known parameters in order.

    std::string base_sql = R"(
        SELECT p.id, p.name, p.description, p.price, p.category_id, p.manufacturer_id, p.created_at,
               c.name AS category_name, m.name AS manufacturer_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
    )";
    std::vector<std::string> where_clauses;
    std::vector<pqxx::field_conversion::arg> params_list;
    int current_param_idx = 1;

    if (nameFilter) {
        where_clauses.push_back("p.name ILIKE $" + std::to_string(current_param_idx++));
        params_list.push_back("%" + *nameFilter + "%");
    }
    if (categoryId) {
        where_clauses.push_back("p.category_id = $" + std::to_string(current_param_idx++));
        params_list.push_back(*categoryId);
    }
    if (manufacturerId) {
        where_clauses.push_back("p.manufacturer_id = $" + std::to_string(current_param_idx++));
        params_list.push_back(*manufacturerId);
    }
    if (minPrice) {
        where_clauses.push_back("p.price >= $" + std::to_string(current_param_idx++));
        params_list.push_back(*minPrice);
    }
    if (maxPrice) {
        where_clauses.push_back("p.price <= $" + std::to_string(current_param_idx++));
        params_list.push_back(*maxPrice);
    }

    std::ostringstream final_sql_stream;
    final_sql_stream << base_sql;
    if (!where_clauses.empty()) {
        final_sql_stream << " WHERE " << where_clauses[0];
        for (size_t i = 1; i < where_clauses.size(); ++i) {
            final_sql_stream << " AND " << where_clauses[i];
        }
    }
    final_sql_stream << " ORDER BY p.name ASC ";
    final_sql_stream << " LIMIT $" << current_param_idx++ << " OFFSET $" << current_param_idx++ << ";";
    
    params_list.push_back(limit);
    params_list.push_back(offset);

    // Call exec_params with the dynamically generated list of arguments
    // For this, pqxx has `pqxx::work::exec_prepared(std::string_view statement_name, const Argument... args)`
    // Or for `nontransaction`, we can use `conn->prepare` and then `w.exec_prepared`.
    // Let's do it simpler, without prepared statements name, and directly unpack parameters.
    // A robust way to handle dynamic arguments with `pqxx::nontransaction::exec_params`:
    // You need to call `exec_params` with the parameters directly.
    // For a variable number of parameters, manual unpacking or `exec_params_n` (if available and suitable) is needed.
    // The current `pqxx` API for `exec_params` expects a variadic set of arguments, not a `std::vector`.
    // To solve this for variable number of arguments, we either build a string with `pqxx::quote` for each parameter
    // (which defeats prepared statement benefits) or use a helper that adapts to `exec_params`.
    // For simplicity of this example, we will assume a fixed small number of parameters and overload,
    // OR we just use a generic `exec(const std::string& query)` and build the query string carefully
    // (risking SQL injection if not quoting correctly).
    // Let's go with building the SQL string with `quote` from `pqxx` for dynamic query building with safety.
    // THIS IS A TRADE-OFF. For truly prepared statements with dynamic filters, a more complex layer is needed.

    std::ostringstream sql_with_values_stream;
    sql_with_values_stream << base_sql;
    std::vector<std::string> dynamic_conditions;

    if (nameFilter) dynamic_conditions.push_back("p.name ILIKE " + w.quote("%" + *nameFilter + "%"));
    if (categoryId) dynamic_conditions.push_back("p.category_id = " + w.quote(*categoryId));
    if (manufacturerId) dynamic_conditions.push_back("p.manufacturer_id = " + w.quote(*manufacturerId));
    if (minPrice) dynamic_conditions.push_back("p.price >= " + w.quote(*minPrice));
    if (maxPrice) dynamic_conditions.push_back("p.price <= " + w.quote(*maxPrice));

    if (!dynamic_conditions.empty()) {
        sql_with_values_stream << " WHERE " << dynamic_conditions[0];
        for (size_t i = 1; i < dynamic_conditions.size(); ++i) {
            sql_with_values_stream << " AND " << dynamic_conditions[i];
        }
    }
    sql_with_values_stream << " ORDER BY p.name ASC ";
    sql_with_values_stream << " LIMIT " << w.quote(limit) << " OFFSET " << w.quote(offset) << ";";

    r = w.exec(sql_with_values_stream.str());
    Database::releaseConnection(conn);

    for (const auto& row : r) {
        Product product;
        product.id = row["id"].as<long long>();
        product.name = row["name"].as<std::string>();
        product.description = row["description"].as<std::optional<std::string>>();
        product.price = row["price"].as<double>();
        product.category_id = row["category_id"].as<std::optional<long long>>();
        product.manufacturer_id = row["manufacturer_id"].as<std::optional<long long>>();
        product.created_at = row["created_at"].as<std::optional<std::string>>();
        product.category_name = row["category_name"].as<std::optional<std::string>>();
        product.manufacturer_name = row["manufacturer_name"].as<std::optional<std::string>>();
        products.push_back(product);
    }
    LOG_DEBUG("Found {} products with filter.", products.size());
    return products;
}

Product ProductService::updateProduct(long long id, const Product& product) {
    if (product.name.empty() || product.price <= 0) {
        throw InputValidationError("Product name cannot be empty and price must be positive.");
    }

    return Database::executeTransaction([&](pqxx::work& txn) {
        std::string sql = R"(
            UPDATE products
            SET name = $1, description = $2, price = $3, category_id = $4, manufacturer_id = $5
            WHERE id = $6
            RETURNING id, name, description, price, category_id, manufacturer_id, created_at;
        )";
        pqxx::result r = txn.exec_params(
            sql,
            product.name,
            product.description,
            product.price,
            product.category_id,
            product.manufacturer_id,
            id
        );

        if (r.empty()) {
            throw NotFoundError("Product with ID " + std::to_string(id) + " not found for update.");
        }

        const auto& row = r[0];
        Product updatedProduct;
        updatedProduct.id = row["id"].as<long long>();
        updatedProduct.name = row["name"].as<std::string>();
        updatedProduct.description = row["description"].as<std::optional<std::string>>();
        updatedProduct.price = row["price"].as<double>();
        updatedProduct.category_id = row["category_id"].as<std::optional<long long>>();
        updatedProduct.manufacturer_id = row["manufacturer_id"].as<std::optional<long long>>();
        updatedProduct.created_at = row["created_at"].as<std::optional<std::string>>();
        LOG_INFO("Product with ID {} updated.", id);
        return updatedProduct;
    });
}

void ProductService::deleteProduct(long long id) {
    Database::executeTransaction([&](pqxx::work& txn) {
        std::string sql = "DELETE FROM products WHERE id = $1;";
        pqxx::result r = txn.exec_params(sql, id);

        if (r.affected_rows() == 0) {
            throw NotFoundError("Product with ID " + std::to_string(id) + " not found for deletion.");
        }
        LOG_INFO("Product with ID {} deleted.", id);
    });
}
```