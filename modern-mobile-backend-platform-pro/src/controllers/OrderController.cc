```cpp
#include "OrderController.h"
#include "src/models/DTOs.h"
#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"
#include <json/json.h>

namespace controllers
{
    OrderController::OrderController(std::shared_ptr<services::OrderService> orderService)
        : orderService_(std::move(orderService))
    {
        LOG_INFO("OrderController initialized.");
    }

    void OrderController::placeOrder(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        std::string userId = getUserIdFromRequest(req); // Get authenticated user ID

        auto json = parseJsonBody(req);
        models::PlaceOrderRequest request;
        request.fromJson(json);

        orderService_->placeOrder(userId, request)
            .then([this, callback](models::Order order) {
                callback(createSuccessResponse(order.toJson(true), "Order placed successfully.", drogon::k201Created));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void OrderController::getUserOrders(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback)
    {
        std::string userId = getUserIdFromRequest(req);

        orderService_->getOrdersByUserId(userId)
            .then([this, callback](std::vector<models::Order> orders) {
                Json::Value ordersJson(Json::arrayValue);
                for (const auto &order : orders)
                {
                    ordersJson.append(order.toJson(true)); // Include items
                }
                callback(createSuccessResponse(ordersJson, "User orders retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void OrderController::getOrderById(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string userId = getUserIdFromRequest(req);

        orderService_->getOrderById(id, userId)
            .then([this, callback](models::Order order) {
                callback(createSuccessResponse(order.toJson(true), "Order retrieved successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void OrderController::updateOrderStatus(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string userId = getUserIdFromRequest(req);

        auto json = parseJsonBody(req);
        models::UpdateOrderStatusRequest request;
        request.fromJson(json);

        orderService_->updateOrderStatus(id, userId, request)
            .then([this, callback](models::Order order) {
                callback(createSuccessResponse(order.toJson(false), "Order status updated successfully.")); // No need for items on status update
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

    void OrderController::deleteOrder(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback, std::string id)
    {
        std::string userId = getUserIdFromRequest(req);

        orderService_->deleteOrder(id, userId)
            .then([this, callback](bool success) {
                (void)success;
                callback(createSuccessResponse({}, "Order deleted successfully."));
            })
            .then([callback](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (...) { /* Rethrow for middleware */ }
            });
    }

} // namespace controllers
```