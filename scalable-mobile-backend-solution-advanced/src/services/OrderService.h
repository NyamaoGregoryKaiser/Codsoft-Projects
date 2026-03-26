```cpp
#pragma once

#include <drogon/drogon.h>
#include <string>
#include <vector>
#include <optional>
#include "../models/Order.h"
#include "../models/Product.h"
#include "../repositories/OrderRepository.h"
#include "../repositories/ProductRepository.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Service for managing order-related business logic.
 *
 * This class handles complex operations like creating orders with multiple items,
 * checking stock, calculating totals, and managing order status.
 */
class OrderService {
public:
    /**
     * @brief Constructs an OrderService.
     * @param orderRepo The OrderRepository instance.
     * @param productRepo The ProductRepository instance (used for stock checks and pricing).
     */
    explicit OrderService(OrderRepository orderRepo = OrderRepository(),
                          ProductRepository productRepo = ProductRepository());

    /**
     * @brief Retrieves an order by ID.
     * @param id The UUID of the order.
     * @return An optional Order object if found.
     * @throws Common::ApiException if the order is not found.
     */
    drogon::Task<std::optional<Order>> getOrderById(const UUID& id);

    /**
     * @brief Retrieves all orders for a specific user with pagination.
     * @param userId The UUID of the user.
     * @param limit The maximum number of orders to retrieve.
     * @param offset The number of orders to skip.
     * @return A vector of Order objects.
     */
    drogon::Task<std::vector<Order>> getOrdersByUserId(const UUID& userId, size_t limit, size_t offset);

    /**
     * @brief Retrieves all orders with pagination (typically for admin).
     * @param limit The maximum number of orders to retrieve.
     * @param offset The number of orders to skip.
     * @return A vector of Order objects.
     */
    drogon::Task<std::vector<Order>> getAllOrders(size_t limit, size_t offset);

    /**
     * @brief Creates a new order for a user with multiple items.
     * This method performs stock checks, calculates total amount, and handles
     * the transaction for inserting the order and its items.
     * @param userId The UUID of the user placing the order.
     * @param requestedItems A vector of pairs {product_id, quantity}.
     * @return The created Order object.
     * @throws Common::ApiException if products are not found, stock is insufficient, or invalid input.
     */
    drogon::Task<Order> createOrder(const UUID& userId,
                                    const std::vector<std::pair<UUID, int>>& requestedItems);

    /**
     * @brief Updates the status of an existing order.
     * @param orderId The UUID of the order to update.
     * @param newStatus The new status (e.g., "processed", "shipped", "delivered", "cancelled").
     * @return The updated Order object.
     * @throws Common::ApiException if order not found, invalid status, or status transition error.
     */
    drogon::Task<Order> updateOrderStatus(const UUID& orderId, const std::string& newStatus);

    /**
     * @brief Deletes an order by ID.
     * @param id The UUID of the order to delete.
     * @return True if the order was deleted successfully.
     * @throws Common::ApiException if the order is not found.
     */
    drogon::Task<bool> deleteOrder(const UUID& id);

private:
    OrderRepository orderRepo;
    ProductRepository productRepo;

    /**
     * @brief Validates if a given status string is a known valid order status.
     * @param status The status string to validate.
     * @return True if valid, false otherwise.
     */
    bool isValidOrderStatus(const std::string& status) const;
};
```