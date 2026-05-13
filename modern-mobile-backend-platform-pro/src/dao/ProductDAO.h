```cpp
#pragma once

#include "BaseDAO.h"
#include "src/models/Product.h"
#include <string>
#include <vector>
#include <optional>
#include <future>

namespace dao
{
    /**
     * @brief Data Access Object for Product entities.
     * Provides CRUD operations for the 'products' table.
     */
    class ProductDAO : public BaseDAO
    {
    public:
        /**
         * @brief Constructor for ProductDAO.
         */
        ProductDAO();

        /**
         * @brief Creates a new product in the database.
         * @param product The Product object containing the data to create.
         * @return A Future that resolves to the created Product object (with generated ID).
         * @throws api::ApiException on database errors.
         */
        std::future<models::Product> create(const models::Product &product);

        /**
         * @brief Finds a product by its ID.
         * @param id The ID of the product to find.
         * @return A Future that resolves to an optional Product object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::Product>> findById(const std::string &id);

        /**
         * @brief Updates an existing product in the database.
         * @param product The Product object containing the updated data. The ID must be set.
         * @return A Future that resolves to the updated Product object.
         * @throws api::NotFoundException if the product with the given ID does not exist.
         * @throws api::ApiException on other database errors.
         */
        std::future<models::Product> update(const models::Product &product);

        /**
         * @brief Deletes a product from the database by ID.
         * @param id The ID of the product to delete.
         * @return A Future that resolves to true if deleted, false if not found.
         * @throws api::ApiException on database errors.
         */
        std::future<bool> remove(const std::string &id);

        /**
         * @brief Retrieves all products from the database.
         * @return A Future that resolves to a vector of Product objects.
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::Product>> findAll();
    };

} // namespace dao
```