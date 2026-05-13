```cpp
#include "OrderService.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <format> // C++20 for std::format

namespace services
{
    OrderService::OrderService(std::shared_ptr<dao::OrderDAO> orderDAO,
                               std::shared_ptr<dao::ProductDAO> productDAO)
        : orderDAO_(std::move(orderDAO)), productDAO_(std::move(productDAO))
    {
        LOG_INFO("OrderService initialized.");
    }

    std::future<models::Order> OrderService::placeOrder(const std::string &userId, const models::PlaceOrderRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid order data provided.", "INVALID_ORDER_DATA");
        }

        // 1. Fetch product details and check inventory
        std::vector<std::string> productIds;
        for (const auto &item : request.items)
        {
            productIds.push_back(item.productId);
        }

        // Fetch all necessary product details asynchronously
        return productDAO_->findAll() // Simplified: fetches all, then filters. Better: batch fetch by IDs.
            .then([this, userId, request](std::vector<models::Product> allProducts) mutable {
                std::map<std::string, models::Product> availableProducts;
                for (const auto &p : allProducts)
                {
                    availableProducts[p.id] = p;
                }

                std::vector<models::OrderItem> orderItems;
                double totalAmount = 0.0;

                for (const auto &reqItem : request.items)
                {
                    auto it = availableProducts.find(reqItem.productId);
                    if (it == availableProducts.end())
                    {
                        throw api::NotFoundException(std::format("Product with ID '{}' not found.", reqItem.productId), "PRODUCT_NOT_FOUND");
                    }

                    models::Product product = it->second;

                    if (product.stockQuantity < reqItem.quantity)
                    {
                        throw api::BadRequestException(
                            std::format("Insufficient stock for product '{}'. Available: {}, Requested: {}.",
                                        product.name, product.stockQuantity, reqItem.quantity),
                            "INSUFFICIENT_STOCK");
                    }

                    models::OrderItem orderItem;
                    orderItem.productId = product.id;
                    orderItem.quantity = reqItem.quantity;
                    orderItem.priceAtPurchase = product.price; // Capture price at time of purchase
                    orderItems.push_back(orderItem);

                    totalAmount += (product.price * reqItem.quantity);

                    // Update stock quantity (this will be done in the same transaction)
                    product.stockQuantity -= reqItem.quantity;
                    // Prepare updated product for DAO to save
                    availableProducts[product.id] = product; // Update map with new stock
                }

                models::Order newOrder;
                newOrder.userId = userId;
                newOrder.totalAmount = totalAmount;
                newOrder.status = "pending"; // Initial status
                newOrder.shippingAddress = request.shippingAddress;

                // 2. Create order and order items in a transaction
                return orderDAO_->createOrder(newOrder, orderItems)
                    .then([this, availableProducts, newOrder](models::Order createdOrder) {
                        // 3. Update product stock (as part of the same conceptual transaction)
                        // This should ideally be part of the createOrder DAO transaction.
                        // For a clean separation, the service orchestrates.
                        std::vector<std::future<models::Product>> updateStockFutures;
                        for (const auto& item : createdOrder.items) {
                            models::Product updatedProduct = availableProducts[item.productId];
                            // Ensure the ID is correctly set for update
                            updatedProduct.id = item.productId;
                            updateStockFutures.push_back(productDAO_->update(updatedProduct));
                        }
                        // Wait for all stock updates to complete
                        for(auto& f : updateStockFutures) {
                            f.get();
                        }
                        LOG_INFO("Order '{}' placed and inventory updated successfully for user '{}'.", createdOrder.id, userId);
                        return createdOrder;
                    });
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_CRITICAL("Error during order placement: {}", e.what());
                    throw api::ApiException(std::format("Failed to place order: {}", e.what()), drogon::k500InternalServerError, "ORDER_PLACEMENT_FAILED");
                }
                return models::Order();
            });
    }

    std::future<models::Order> OrderService::getOrderById(const std::string &orderId, const std::string &requesterUserId)
    {
        return orderDAO_->findOrderById(orderId, true)
            .then([orderId, requesterUserId](std::optional<models::Order> orderOpt) {
                if (!orderOpt)
                {
                    LOG_WARN("Order with ID '{}' not found.", orderId);
                    throw api::NotFoundException(std::format("Order with ID '{}' not found.", orderId), "ORDER_NOT_FOUND");
                }
                if (orderOpt->userId != requesterUserId)
                {
                    LOG_WARN("User '{}' attempted to access order '{}' of another user '{}'.", requesterUserId, orderId, orderOpt->userId);
                    throw api::ForbiddenException("Access to order is forbidden.", "ORDER_ACCESS_FORBIDDEN");
                }
                LOG_INFO("Retrieved order with ID: '{}' for user '{}'.", orderId, requesterUserId);
                return *orderOpt;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving order by ID: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve order: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_ORDER_FAILED");
                }
                return models::Order();
            });
    }

    std::future<std::vector<models::Order>> OrderService::getOrdersByUserId(const std::string &userId)
    {
        return orderDAO_->findOrdersByUserId(userId, true)
            .then([userId](std::vector<models::Order> orders) {
                LOG_INFO("Retrieved {} orders for user ID: '{}'.", orders.size(), userId);
                return orders;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error retrieving orders by user ID: {}", e.what());
                    throw api::ApiException(std::format("Failed to retrieve user orders: {}", e.what()), drogon::k500InternalServerError, "RETRIEVE_USER_ORDERS_FAILED");
                }
                return std::vector<models::Order>();
            });
    }

    std::future<models::Order> OrderService::updateOrderStatus(const std::string &orderId, const std::string &requesterUserId, const models::UpdateOrderStatusRequest &request)
    {
        if (!request.isValid())
        {
            throw api::BadRequestException("Invalid status provided for order update.", "INVALID_ORDER_STATUS_DATA");
        }

        return orderDAO_->findOrderById(orderId, false) // Only fetch order, not items, for status update
            .then([this, orderId, requesterUserId, request](std::optional<models::Order> orderOpt) {
                if (!orderOpt)
                {
                    LOG_WARN("Update status attempt for order ID '{}': Order not found.", orderId);
                    throw api::NotFoundException(std::format("Order with ID '{}' not found for status update.", orderId), "ORDER_NOT_FOUND");
                }
                if (orderOpt->userId != requesterUserId)
                {
                    LOG_WARN("User '{}' attempted to update order '{}' of another user '{}'.", requesterUserId, orderId, orderOpt->userId);
                    throw api::ForbiddenException("Access to update order status is forbidden.", "ORDER_STATUS_UPDATE_FORBIDDEN");
                }

                models::Order order = *orderOpt;
                if (order.status == request.status) {
                    LOG_INFO("Order '{}' status already '{}'. No change needed.", orderId, request.status);
                    return std::future<models::Order>(std::async(std::launch::deferred, [order](){ return order; }));
                }

                // Implement state machine logic here if needed (e.g., cannot go from delivered to pending)
                // For simplicity, we allow any transition for now.
                order.status = request.status;
                order.id = orderId; // Ensure ID is set for update

                return orderDAO_->updateOrder(order);
            })
            .then([](models::Order updatedOrder) {
                LOG_INFO("Order with ID '{}' status updated to '{}'.", updatedOrder.id, updatedOrder.status);
                return updatedOrder;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error updating order status: {}", e.what());
                    throw api::ApiException(std::format("Failed to update order status: {}", e.what()), drogon::k500InternalServerError, "ORDER_STATUS_UPDATE_FAILED");
                }
                return models::Order();
            });
    }

    std::future<bool> OrderService::deleteOrder(const std::string &orderId, const std::string &requesterUserId)
    {
        return orderDAO_->findOrderById(orderId, false)
            .then([this, orderId, requesterUserId](std::optional<models::Order> orderOpt) {
                if (!orderOpt)
                {
                    LOG_WARN("Delete attempt for order ID '{}': Order not found.", orderId);
                    throw api::NotFoundException(std::format("Order with ID '{}' not found for deletion.", orderId), "ORDER_NOT_FOUND");
                }
                if (orderOpt->userId != requesterUserId)
                {
                    LOG_WARN("User '{}' attempted to delete order '{}' of another user '{}'.", requesterUserId, orderId, orderOpt->userId);
                    throw api::ForbiddenException("Access to delete order is forbidden.", "ORDER_DELETE_FORBIDDEN");
                }

                return orderDAO_->removeOrder(orderId);
            })
            .then([orderId](bool deleted) {
                if (!deleted)
                {
                    // This case should ideally be caught by findOrderById, but good for defensive programming
                    throw api::NotFoundException(std::format("Order with ID '{}' not found for deletion (after initial check).", orderId), "ORDER_NOT_FOUND");
                }
                LOG_INFO("Order with ID '{}' deleted successfully.", orderId);
                return true;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const api::ApiException &e) { throw; }
                catch (const std::exception &e) {
                    LOG_ERROR("Error deleting order: {}", e.what());
                    throw api::ApiException(std::format("Failed to delete order: {}", e.what()), drogon::k500InternalServerError, "DELETE_ORDER_FAILED");
                }
                return false;
            });
    }

} // namespace services
```