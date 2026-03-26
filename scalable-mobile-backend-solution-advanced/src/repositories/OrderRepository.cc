```cpp
#include "OrderRepository.h"
#include "../database/DBManager.h"

OrderRepository::OrderRepository(drogon::orm::DbClientPtr client) {
    if (client) {
        dbClient = client;
    } else {
        dbClient = DBManager::getClient();
    }
}

drogon::Task<std::optional<Order>> OrderRepository::findById(const UUID& id) {
    try {
        auto result = co_await dbClient->execSqlCoro("SELECT * FROM orders WHERE id = $1", id);
        if (result.empty()) {
            co_return std::nullopt;
        }
        Order order = Order::fromDrogonModel(result[0]);
        order.items = co_await loadOrderItems(order.id);
        co_return order;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error finding order by ID {}: {}", id, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<std::vector<Order>> OrderRepository::findByUserId(const UUID& userId, size_t limit, size_t offset) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC LIMIT $2 OFFSET $3",
            userId, limit, offset
        );
        std::vector<Order> orders;
        for (const auto& row : result) {
            Order order = Order::fromDrogonModel(row);
            order.items = co_await loadOrderItems(order.id); // Load items for each order
            orders.push_back(order);
        }
        co_return orders;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error finding orders for user {}: {}", userId, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<std::vector<Order>> OrderRepository::findAll(size_t limit, size_t offset) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "SELECT * FROM orders ORDER BY order_date DESC LIMIT $1 OFFSET $2",
            limit, offset
        );
        std::vector<Order> orders;
        for (const auto& row : result) {
            Order order = Order::fromDrogonModel(row);
            order.items = co_await loadOrderItems(order.id); // Load items for each order
            orders.push_back(order);
        }
        co_return orders;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error retrieving all orders: {}", e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}


drogon::Task<Order> OrderRepository::insert(Order order) {
    try {
        auto trans = co_await dbClient->newTransactionCoro();

        // 1. Insert the order
        auto orderResult = co_await trans->execSqlCoro(
            "INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *",
            order.user_id, order.total_amount, order.status
        );
        if (orderResult.empty()) {
            throw Common::ApiException(500, "Failed to insert order.");
        }
        Order newOrder = Order::fromDrogonModel(orderResult[0]);

        // 2. Insert order items
        for (auto& item : order.items) {
            auto itemResult = co_await trans->execSqlCoro(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4) RETURNING *",
                newOrder.id, item.product_id, item.quantity, item.price_at_purchase
            );
            if (itemResult.empty()) {
                 throw Common::ApiException(500, "Failed to insert order item.");
            }
            newOrder.items.push_back(OrderItem::fromDrogonModel(itemResult[0]));
        }

        co_await trans->commitCoro();
        LOG_INFO("Order {} and its items inserted successfully for user {}", newOrder.id, newOrder.user_id);
        co_return newOrder;

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error inserting order for user {}: {}", order.user_id, e.what());
        if (std::string(e.what()).find("violates foreign key constraint") != std::string::npos) {
            throw Common::ApiException(400, "Invalid user ID or product ID provided.");
        }
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<Order> OrderRepository::updateStatus(const UUID& orderId, const std::string& newStatus) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
            newStatus, orderId
        );
        if (result.empty()) {
            LOG_WARN("Order with ID {} not found for status update.", orderId);
            throw Common::ApiException(404, "Order not found.");
        }
        Order updatedOrder = Order::fromDrogonModel(result[0]);
        updatedOrder.items = co_await loadOrderItems(updatedOrder.id);
        co_return updatedOrder;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error updating order {} status to {}: {}", orderId, newStatus, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<bool> OrderRepository::remove(const UUID& id) {
    try {
        // Due to CASCADE ON DELETE for order_items, deleting the order will delete its items.
        auto result = co_await dbClient->execSqlCoro("DELETE FROM orders WHERE id = $1 RETURNING id", id);
        co_return !result.empty();
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error deleting order {}: {}", id, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}

drogon::Task<std::vector<OrderItem>> OrderRepository::loadOrderItems(const UUID& orderId) {
    try {
        auto result = co_await dbClient->execSqlCoro(
            "SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE order_id = $1",
            orderId
        );
        std::vector<OrderItem> items;
        for (const auto& row : result) {
            items.push_back(OrderItem::fromDrogonModel(row));
        }
        co_return items;
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error loading items for order {}: {}", orderId, e.what());
        throw Common::ApiException(500, "Database error: " + std::string(e.what()));
    }
}
```