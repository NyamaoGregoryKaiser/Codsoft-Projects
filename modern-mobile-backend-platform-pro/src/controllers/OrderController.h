```cpp
#pragma once

#include "BaseController.h"
#include "src/services/OrderService.h"
#include <memory>

namespace controllers
{
    /**
     * @brief Controller for order management endpoints.
     * Inherits from BaseController for common utilities and error handling.
     * Requires authentication for all order operations.
     */
    class OrderController : public drogon::HttpController<OrderController>, public BaseController
    {
    public:
        /**
         * @brief Constructor for OrderController.
         * @param orderService Shared pointer to the OrderService instance.
         */
        explicit OrderController(std::shared_ptr<services::OrderService> orderService);

        METHOD_LIST_BEGIN
        // API group "/api/v1/orders"
        ADD_METHOD_TO(OrderController::placeOrder, "/api/v1/orders", drogon::Post, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(OrderController::getUserOrders, "/api/v1/orders/my", drogon::Get, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(OrderController::getOrderById, "/api/v1/orders/{id}", drogon::Get, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(OrderController::updateOrderStatus, "/api/v1/orders/{id}/status", drogon::Put, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        ADD_METHOD_TO(OrderController::deleteOrder, "/api/v1/orders/{id}", drogon::Delete, {middleware::AuthMiddleware, middleware::ErrorHandlingMiddleware});
        METHOD_LIST_END

        /**
         * @brief Handles placing a new order.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void placeOrder(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

        /**
         * @brief Handles retrieving all orders for the authenticated user.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void getUserOrders(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback);

        /**
         * @brief Handles retrieving a specific order by ID.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the order to retrieve.
         */
        void getOrderById(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Handles updating the status of an order.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the order to update.
         */
        void updateOrderStatus(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

        /**
         * @brief Handles deleting an order.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param id The ID of the order to delete.
         */
        void deleteOrder(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id);

    private:
        std::shared_ptr<services::OrderService> orderService_;
    };

} // namespace controllers
```