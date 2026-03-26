```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include "../services/OrderService.h"
#include "../utils/Logger.h"
#include "../utils/Common.h" // For ApiException

/**
 * @brief Controller for Order management endpoints.
 */
class OrderController : public drogon::HttpController<OrderController> {
public:
    // Inject OrderService
    explicit OrderController(OrderService orderService = OrderService());

    METHOD_LIST_BEGIN
    // Authenticated routes. `AuthFilter` ensures user is logged in.
    // Admin users can access all orders, regular users only their own.
    METHOD_ADD(OrderController::getAllOrders, "", drogon::Get, "RateLimitFilter", "AuthFilter");
    METHOD_ADD(OrderController::getOrderById, "/{id}", drogon::Get, "RateLimitFilter", "AuthFilter");
    METHOD_ADD(OrderController::createOrder, "", drogon::Post, "RateLimitFilter", "AuthFilter");
    METHOD_ADD(OrderController::updateOrderStatus, "/{id}/status", drogon::Patch, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_ADD(OrderController::deleteOrder, "/{id}", drogon::Delete, "RateLimitFilter", "AuthFilter", "AuthFilter::admin");
    METHOD_LIST_END

    /**
     * @brief Handles GET /orders. Retrieves all orders (admin) or user's own orders (regular user).
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param limit Query parameter for page size.
     * @param offset Query parameter for page offset.
     */
    void getAllOrders(const drogon::HttpRequestPtr& req,
                      std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                      long limit = 10, long offset = 0);

    /**
     * @brief Handles GET /orders/{id}. Retrieves a single order by ID.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the order.
     */
    void getOrderById(const drogon::HttpRequestPtr& req,
                      std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                      const std::string& id);

    /**
     * @brief Handles POST /orders. Creates a new order for the authenticated user.
     * @param req The HTTP request with JSON payload containing order items.
     * @param callback The callback to send the response.
     */
    void createOrder(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    /**
     * @brief Handles PATCH /orders/{id}/status (Admin Only). Updates an order's status.
     * @param req The HTTP request with JSON payload containing the new status.
     * @param callback The callback to send the response.
     * @param id The UUID of the order to update.
     */
    void updateOrderStatus(const drogon::HttpRequestPtr& req,
                           std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                           const std::string& id);

    /**
     * @brief Handles DELETE /orders/{id} (Admin Only). Deletes an order.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     * @param id The UUID of the order to delete.
     */
    void deleteOrder(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     const std::string& id);

private:
    OrderService orderService;
};
```