```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include "../models/Order.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Repository for Order and OrderItem data access operations.
 *
 * This class handles CRUD operations for orders and their associated items,
 * often involving transactions for data consistency.
 */
class OrderRepository {
public:
    /**
     * @brief Constructs an OrderRepository with a database client.
     * @param client The shared pointer to the Drogon DbClient.
     */
    explicit OrderRepository(drogon::orm::DbClientPtr client = nullptr);

    /**
     * @brief Finds an order by its ID, including its associated items.
     * @param id The UUID of the order.
     * @return An optional Order object if found.
     */
    drogon::Task<std::optional<Order>> findById(const UUID& id);

    /**
     * @brief Finds all orders for a specific user, including their associated items.
     * @param userId The UUID of the user.
     * @param limit The maximum number of orders to retrieve.
     * @param offset The number of orders to skip.
     * @return A vector of Order objects.
     */
    drogon::Task<std::vector<Order>> findByUserId(const UUID& userId, size_t limit, size_t offset);

    /**
     * @brief Retrieves all orders, including their associated items, with pagination.
     * @param limit The maximum number of orders to retrieve.
     * @param offset The number of orders to skip.
     * @return A vector of Order objects.
     */
    drogon::Task<std::vector<Order>> findAll(size_t limit, size_t offset);

    /**
     * @brief Inserts a new order and its items into the database within a transaction.
     * @param order The Order object to insert (items should be populated).
     * @return The inserted Order object with generated IDs and timestamps.
     * @throws Common::ApiException if a database error occurs or if items are invalid.
     */
    drogon::Task<Order> insert(Order order);

    /**
     * @brief Updates the status of an existing order.
     * @param orderId The UUID of the order to update.
     * @param newStatus The new status string.
     * @return The updated Order object.
     * @throws Common::ApiException if the order is not found or a database error occurs.
     */
    drogon::Task<Order> updateStatus(const UUID& orderId, const std::string& newStatus);

    /**
     * @brief Deletes an order and its items from the database.
     * @param id The UUID of the order to delete.
     * @return True if the order was deleted, false if not found.
     * @throws Common::ApiException if a database error occurs.
     */
    drogon::Task<bool> remove(const UUID& id);

private:
    drogon::orm::DbClientPtr dbClient;

    /**
     * @brief Helper to load order items for a given order ID.
     * @param orderId The UUID of the order.
     * @return A vector of OrderItem objects.
     */
    drogon::Task<std::vector<OrderItem>> loadOrderItems(const UUID& orderId);
};
```