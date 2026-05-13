```cpp
#pragma once

#include "BaseDAO.h"
#include "src/models/Order.h"
#include <string>
#include <vector>
#include <optional>
#include <future>

namespace dao
{
    /**
     * @brief Data Access Object for Order and OrderItem entities.
     * Provides CRUD operations for 'orders' and 'order_items' tables.
     */
    class OrderDAO : public BaseDAO
    {
    public:
        /**
         * @brief Constructor for OrderDAO.
         */
        OrderDAO();

        /**
         * @brief Creates a new order and its items in the database within a transaction.
         * @param order The Order object containing the data to create.
         * @param orderItems A vector of OrderItem objects associated with the order.
         * @return A Future that resolves to the created Order object (with generated ID and items).
         * @throws api::ApiException on database errors.
         */
        std::future<models::Order> createOrder(const models::Order &order, const std::vector<models::OrderItem> &orderItems);

        /**
         * @brief Finds an order by its ID, optionally including its items.
         * @param id The ID of the order to find.
         * @param includeItems If true, also fetches associated order items.
         * @return A Future that resolves to an optional Order object.
         * @throws api::ApiException on database errors.
         */
        std::future<std::optional<models::Order>> findOrderById(const std::string &id, bool includeItems = false);

        /**
         * @brief Finds all orders for a specific user, optionally including their items.
         * @param userId The ID of the user whose orders to find.
         * @param includeItems If true, also fetches associated order items.
         * @return A Future that resolves to a vector of Order objects.
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::Order>> findOrdersByUserId(const std::string &userId, bool includeItems = false);

        /**
         * @brief Updates an existing order's status and total amount in the database.
         * Note: This DAO does not support updating order items directly through this method,
         * as item changes are usually handled during order creation or through specific item update logic.
         * @param order The Order object containing the updated data. The ID must be set.
         * @return A Future that resolves to the updated Order object.
         * @throws api::NotFoundException if the order with the given ID does not exist.
         * @throws api::ApiException on other database errors.
         */
        std::future<models::Order> updateOrder(const models::Order &order);

        /**
         * @brief Deletes an order from the database by ID.
         * Also deletes associated order items due to CASCADE constraint.
         * @param id The ID of the order to delete.
         * @return A Future that resolves to true if deleted, false if not found.
         * @throws api::ApiException on database errors.
         */
        std::future<bool> removeOrder(const std::string &id);

        /**
         * @brief Retrieves all orders from the database.
         * @param includeItems If true, also fetches associated order items for each order.
         * @return A Future that resolves to a vector of Order objects.
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::Order>> findAllOrders(bool includeItems = false);

    private:
        /**
         * @brief Helper to fetch order items for a given order ID.
         * @param orderId The ID of the order.
         * @return A Future that resolves to a vector of OrderItem objects.
         */
        std::future<std::vector<models::OrderItem>> findItemsByOrderId(const std::string &orderId);
    };

} // namespace dao
```