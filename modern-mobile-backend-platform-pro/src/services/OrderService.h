```cpp
#pragma once

#include "src/dao/OrderDAO.h"
#include "src/dao/ProductDAO.h"
#include "src/models/Order.h"
#include "src/models/Product.h"
#include "src/models/DTOs.h"
#include <memory>
#include <string>
#include <vector>
#include <future>
#include <numeric>

namespace services
{
    /**
     * @brief Service for order management.
     * Handles creating, retrieving, updating, and deleting orders, including inventory management.
     */
    class OrderService
    {
    public:
        /**
         * @brief Constructor for OrderService.
         * @param orderDAO Shared pointer to the OrderDAO instance.
         * @param productDAO Shared pointer to the ProductDAO instance (for inventory checks).
         */
        explicit OrderService(std::shared_ptr<dao::OrderDAO> orderDAO,
                              std::shared_ptr<dao::ProductDAO> productDAO);

        /**
         * @brief Places a new order for a user.
         * Performs inventory checks, calculates total amount, creates order and order items transactionally.
         * @param userId The ID of the user placing the order.
         * @param request The place order request.
         * @return A Future that resolves to the created Order object (with items).
         * @throws api::BadRequestException if input is invalid or inventory is insufficient.
         * @throws api::NotFoundException if products in the order are not found.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Order> placeOrder(const std::string &userId, const models::PlaceOrderRequest &request);

        /**
         * @brief Retrieves an order by ID.
         * @param orderId The ID of the order to retrieve.
         * @param requesterUserId The ID of the user requesting the order (for authorization).
         * @return A Future that resolves to the Order object (with items).
         * @throws api::NotFoundException if the order is not found.
         * @throws api::ForbiddenException if the requester is not authorized to view this order.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Order> getOrderById(const std::string &orderId, const std::string &requesterUserId);

        /**
         * @brief Retrieves all orders for a specific user.
         * @param userId The ID of the user whose orders to retrieve.
         * @return A Future that resolves to a vector of Order objects (with items).
         * @throws api::ApiException on database errors.
         */
        std::future<std::vector<models::Order>> getOrdersByUserId(const std::string &userId);

        /**
         * @brief Updates an order's status.
         * @param orderId The ID of the order to update.
         * @param requesterUserId The ID of the user requesting the update (for authorization).
         * @param request The update order status request.
         * @return A Future that resolves to the updated Order object.
         * @throws api::BadRequestException if input is invalid.
         * @throws api::NotFoundException if the order is not found.
         * @throws api::ForbiddenException if the requester is not authorized to update this order.
         * @throws api::ApiException on other errors.
         */
        std::future<models::Order> updateOrderStatus(const std::string &orderId, const std::string &requesterUserId, const models::UpdateOrderStatusRequest &request);

        /**
         * @brief Deletes an order by ID.
         * @param orderId The ID of the order to delete.
         * @param requesterUserId The ID of the user requesting the deletion (for authorization).
         * @return A Future that resolves to true if deleted.
         * @throws api::NotFoundException if the order is not found.
         * @throws api::ForbiddenException if the requester is not authorized to delete this order.
         * @throws api::ApiException on other errors.
         */
        std::future<bool> deleteOrder(const std::string &orderId, const std::string &requesterUserId);

    private:
        std::shared_ptr<dao::OrderDAO> orderDAO_;
        std::shared_ptr<dao::ProductDAO> productDAO_;
    };

} // namespace services
```