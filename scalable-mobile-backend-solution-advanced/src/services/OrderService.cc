```cpp
#include "OrderService.h"
#include <set>

OrderService::OrderService(OrderRepository orderRepo, ProductRepository productRepo)
    : orderRepo(std::move(orderRepo)), productRepo(std::move(productRepo)) {}

drogon::Task<std::optional<Order>> OrderService::getOrderById(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid order ID format.");
    }
    return orderRepo.findById(id);
}

drogon::Task<std::vector<Order>> OrderService::getOrdersByUserId(const UUID& userId, size_t limit, size_t offset) {
    if (!Common::isValidUUID(userId)) {
        throw Common::ApiException(400, "Invalid user ID format.");
    }
    return orderRepo.findByUserId(userId, limit, offset);
}

drogon::Task<std::vector<Order>> OrderService::getAllOrders(size_t limit, size_t offset) {
    return orderRepo.findAll(limit, offset);
}

drogon::Task<Order> OrderService::createOrder(const UUID& userId,
                                                const std::vector<std::pair<UUID, int>>& requestedItems) {
    if (!Common::isValidUUID(userId)) {
        throw Common::ApiException(400, "Invalid user ID format.");
    }
    if (requestedItems.empty()) {
        throw Common::ApiException(400, "Order must contain at least one item.");
    }

    Order newOrder;
    newOrder.user_id = userId;
    newOrder.status = "pending"; // Initial status
    newOrder.total_amount = 0.0;
    
    std::set<UUID> uniqueProductIds;

    for (const auto& reqItem : requestedItems) {
        const UUID& productId = reqItem.first;
        int quantity = reqItem.second;

        if (!Common::isValidUUID(productId)) {
            throw Common::ApiException(400, "Invalid product ID format in order items.");
        }
        if (quantity <= 0) {
            throw Common::ApiException(400, "Item quantity must be positive for product ID " + productId);
        }
        if (uniqueProductIds.count(productId)) {
            throw Common::ApiException(400, "Duplicate product ID found in order items: " + productId);
        }
        uniqueProductIds.insert(productId);

        std::optional<Product> productOpt = co_await productRepo.findById(productId);
        if (!productOpt) {
            throw Common::ApiException(404, "Product with ID " + productId + " not found.");
        }
        Product product = productOpt.value();

        if (product.stock_quantity < quantity) {
            throw Common::ApiException(400, "Insufficient stock for product '" + product.name + "'. Available: " + std::to_string(product.stock_quantity) + ", Requested: " + std::to_string(quantity));
        }

        OrderItem item;
        item.product_id = productId;
        item.product_name = product.name; // Store name for easier access without join
        item.quantity = quantity;
        item.price_at_purchase = product.price; // Capture price at time of purchase
        newOrder.total_amount += (item.quantity * item.price_at_purchase);
        newOrder.items.push_back(item);

        // Optimistically update stock, rollback on transaction failure
        product.stock_quantity -= quantity;
        co_await productRepo.update(product);
    }
    
    // Insert order and its items in a transaction (handled by repository)
    Order createdOrder = co_await orderRepo.insert(newOrder);
    LOG_INFO("Order {} created for user {}. Total: {}", createdOrder.id, createdOrder.user_id, createdOrder.total_amount);
    co_return createdOrder;
}

drogon::Task<Order> OrderService::updateOrderStatus(const UUID& orderId, const std::string& newStatus) {
    if (!Common::isValidUUID(orderId)) {
        throw Common::ApiException(400, "Invalid order ID format.");
    }
    if (!isValidOrderStatus(newStatus)) {
        throw Common::ApiException(400, "Invalid order status: " + newStatus);
    }

    std::optional<Order> orderOpt = co_await orderRepo.findById(orderId);
    if (!orderOpt) {
        throw Common::ApiException(404, "Order not found.");
    }
    Order order = orderOpt.value();

    // Implement status transition logic if needed (e.g., cannot go from 'delivered' to 'pending')
    if (order.status == "cancelled" || order.status == "delivered") {
        if (newStatus != order.status) { // Only allow self-transition or specific cases
            LOG_WARN("Attempted to change status of order {} from final state {} to {}.", orderId, order.status, newStatus);
            throw Common::ApiException(400, "Cannot change status of a " + order.status + " order.");
        }
    }
    // Add more complex transitions as needed
    
    Order updatedOrder = co_await orderRepo.updateStatus(orderId, newStatus);
    LOG_INFO("Order {} status updated from {} to {}.", orderId, order.status, newStatus);
    co_return updatedOrder;
}

drogon::Task<bool> OrderService::deleteOrder(const UUID& id) {
    if (!Common::isValidUUID(id)) {
        throw Common::ApiException(400, "Invalid order ID format.");
    }

    bool deleted = co_await orderRepo.remove(id);
    if (!deleted) {
        throw Common::ApiException(404, "Order not found.");
    }
    LOG_INFO("Order {} deleted successfully.", id);
    co_return true;
}

bool OrderService::isValidOrderStatus(const std::string& status) const {
    static const std::set<std::string> validStatuses = {
        "pending", "processed", "shipped", "delivered", "cancelled"
    };
    return validStatuses.count(status) > 0;
}
```