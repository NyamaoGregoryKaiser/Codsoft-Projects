```cpp
#include "OrderDAO.h"
#include "src/utils/Logger.h"
#include <format> // C++20 for std::format

namespace dao
{
    OrderDAO::OrderDAO() : BaseDAO("orders") {}

    std::future<models::Order> OrderDAO::createOrder(const models::Order &order, const std::vector<models::OrderItem> &orderItems)
    {
        // Start a transaction for creating an order and its items
        return dbClient_->execSqlAsync("BEGIN").then([this, order, orderItems]() {
            std::string orderSql = "INSERT INTO orders (user_id, total_amount, status, shipping_address) "
                                   "VALUES ($1, $2, $3, $4) RETURNING *";
            LOG_DEBUG("SQL (Order): {}", orderSql);

            auto orderParams = {
                drogon::orm::internal::OptionalType(order.userId),
                drogon::orm::internal::OptionalType(order.totalAmount),
                drogon::orm::internal::OptionalType(order.status),
                drogon::orm::internal::OptionalType(order.shippingAddress)
            };

            return dbClient_->execSqlAsync(orderSql, orderParams);
        }).then([this, orderItems](drogon::orm::Result orderResult) {
            if (orderResult.empty())
            {
                // This should ideally not happen if RETURNING * is used correctly
                LOG_ERROR("Order creation returned no rows, rolling back.");
                return dbClient_->execSqlAsync("ROLLBACK").then([]() {
                    throw api::ApiException("Failed to create order", drogon::k500InternalServerError, "ORDER_CREATION_FAILED");
                    return drogon::orm::Result();
                });
            }

            models::Order createdOrder;
            createdOrder.fromSqlRow(orderResult[0]);
            LOG_INFO("Created order with ID: {}", createdOrder.id);

            if (orderItems.empty()) {
                // If no items, commit and return
                return dbClient_->execSqlAsync("COMMIT").then([createdOrder]() {
                    return createdOrder;
                });
            }

            // Insert order items
            std::string itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ";
            std::vector<drogon::orm::internal::OptionalType> itemParams;
            std::string valuesPlaceholder;

            for (size_t i = 0; i < orderItems.size(); ++i)
            {
                const auto &item = orderItems[i];
                valuesPlaceholder += std::format("(${}, ${}, ${}, ${})",
                                                 itemParams.size() + 1,
                                                 itemParams.size() + 2,
                                                 itemParams.size() + 3,
                                                 itemParams.size() + 4);
                if (i < orderItems.size() - 1)
                {
                    valuesPlaceholder += ", ";
                }

                itemParams.push_back(drogon::orm::internal::OptionalType(createdOrder.id));
                itemParams.push_back(drogon::orm::internal::OptionalType(item.productId));
                itemParams.push_back(drogon::orm::internal::OptionalType(item.quantity));
                itemParams.push_back(drogon::orm::internal::OptionalType(item.priceAtPurchase));
            }
            itemSql += valuesPlaceholder + " RETURNING *";
            LOG_DEBUG("SQL (Order Items): {}", itemSql);

            return dbClient_->execSqlAsync(itemSql, itemParams)
                .then([this, createdOrder](drogon::orm::Result itemResults) mutable {
                    for (const auto &row : itemResults)
                    {
                        models::OrderItem item;
                        item.fromSqlRow(row);
                        createdOrder.items.push_back(item);
                    }
                    LOG_INFO("Inserted {} order items for order ID: {}", createdOrder.items.size(), createdOrder.id);
                    return dbClient_->execSqlAsync("COMMIT").then([createdOrder]() {
                        return createdOrder;
                    });
                })
                .then([](std::exception_ptr eptr) {
                    // This catch block handles exceptions from item insertion
                    // If an exception occurs, need to rollback
                    return drogon::app().get){throw std::rethrow_exception(eptr);});
                });
        }).then([](std::exception_ptr eptr) {
            // This catch block handles exceptions from the entire transaction (order and items)
            try { std::rethrow_exception(eptr); }
            catch (const drogon::orm::DrogonDbException &e) {
                // Attempt a rollback. The original error will still be re-thrown.
                LOG_ERROR("Transaction failed, attempting rollback: {}", e.what());
                // Note: calling rollback async here. If the initial execSqlAsync("BEGIN") failed, this might not run
                // A more robust solution might use a RAII transaction guard.
                drogon::app().getDbClient()->execSqlAsync("ROLLBACK").then([](drogon::orm::Result){LOG_ERROR("Rollback successful.");}, [](const drogon::orm::DrogonDbException& roll_e){LOG_ERROR("Rollback failed: {}", roll_e.what());});
                throw api::ApiException(std::format("Database error creating order: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
            }
            catch (...) { throw; }
            return models::Order(); // Should not reach here
        });
    }


    std::future<std::optional<models::Order>> OrderDAO::findOrderById(const std::string &id, bool includeItems)
    {
        std::string sql = "SELECT * FROM orders WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([this, includeItems](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_DEBUG("Order with ID '{}' not found.", id);
                    return std::optional<models::Order>();
                }
                models::Order order;
                order.fromSqlRow(result[0]);

                if (includeItems)
                {
                    return findItemsByOrderId(order.id).then([order](std::vector<models::OrderItem> items) mutable {
                        order.items = std::move(items);
                        return std::optional<models::Order>(order);
                    });
                }
                return std::optional<models::Order>(order);
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding order by ID: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::optional<models::Order>();
            });
    }

    std::future<std::vector<models::Order>> OrderDAO::findOrdersByUserId(const std::string &userId, bool includeItems)
    {
        std::string sql = "SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, userId)
            .then([this, includeItems](drogon::orm::Result result) {
                std::vector<models::Order> orders;
                std::vector<std::future<std::vector<models::OrderItem>>> itemFutures;

                for (const auto &row : result)
                {
                    models::Order order;
                    order.fromSqlRow(row);
                    orders.push_back(order);

                    if (includeItems)
                    {
                        itemFutures.push_back(findItemsByOrderId(order.id));
                    }
                }

                if (includeItems)
                {
                    // Wait for all item futures to complete
                    std::vector<std::vector<models::OrderItem>> allItems;
                    for (auto &f : itemFutures)
                    {
                        allItems.push_back(f.get());
                    }

                    // Assign items back to their respective orders
                    for (size_t i = 0; i < orders.size(); ++i)
                    {
                        orders[i].items = std::move(allItems[i]);
                    }
                }
                LOG_INFO("Found {} orders for user ID: {}", orders.size(), userId);
                return orders;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding orders by user ID: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::vector<models::Order>();
            });
    }

    std::future<models::Order> OrderDAO::updateOrder(const models::Order &order)
    {
        std::string sql = "UPDATE orders SET total_amount = $1, status = $2, shipping_address = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *";
        LOG_DEBUG("SQL: {}", sql);

        auto params = {
            drogon::orm::internal::OptionalType(order.totalAmount),
            drogon::orm::internal::OptionalType(order.status),
            drogon::orm::internal::OptionalType(order.shippingAddress),
            drogon::orm::internal::OptionalType(order.id)
        };

        return dbClient_->execSqlAsync(sql, params)
            .then([](drogon::orm::Result result) {
                if (result.empty())
                {
                    LOG_WARN("Update order with ID '{}' affected no rows.", order.id);
                    throw api::NotFoundException(std::format("Order with ID '{}' not found for update.", order.id));
                }
                models::Order updatedOrder;
                updatedOrder.fromSqlRow(result[0]);
                LOG_INFO("Updated order with ID: {}", updatedOrder.id);
                return updatedOrder;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error updating order: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return models::Order();
            });
    }

    std::future<bool> OrderDAO::removeOrder(const std::string &id)
    {
        std::string sql = "DELETE FROM orders WHERE id = $1";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, id)
            .then([](drogon::orm::Result result) {
                size_t rowsAffected = result.affectedRows();
                if (rowsAffected > 0)
                {
                    LOG_INFO("Deleted order with ID: {}", id);
                    return true;
                }
                LOG_WARN("Delete order with ID '{}' affected no rows (not found).", id);
                return false;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error deleting order: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return false;
            });
    }

    std::future<std::vector<models::Order>> OrderDAO::findAllOrders(bool includeItems)
    {
        std::string sql = "SELECT * FROM orders ORDER BY order_date DESC";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql)
            .then([this, includeItems](drogon::orm::Result result) {
                std::vector<models::Order> orders;
                std::vector<std::future<std::vector<models::OrderItem>>> itemFutures;

                for (const auto &row : result)
                {
                    models::Order order;
                    order.fromSqlRow(row);
                    orders.push_back(order);

                    if (includeItems)
                    {
                        itemFutures.push_back(findItemsByOrderId(order.id));
                    }
                }

                if (includeItems)
                {
                    // Wait for all item futures to complete
                    std::vector<std::vector<models::OrderItem>> allItems;
                    for (auto &f : itemFutures)
                    {
                        allItems.push_back(f.get());
                    }

                    // Assign items back to their respective orders
                    for (size_t i = 0; i < orders.size(); ++i)
                    {
                        orders[i].items = std::move(allItems[i]);
                    }
                }
                LOG_INFO("Found {} total orders.", orders.size());
                return orders;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding all orders: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::vector<models::Order>();
            });
    }

    std::future<std::vector<models::OrderItem>> OrderDAO::findItemsByOrderId(const std::string &orderId)
    {
        std::string sql = "SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at";
        LOG_DEBUG("SQL: {}", sql);

        return dbClient_->execSqlAsync(sql, orderId)
            .then([](drogon::orm::Result result) {
                std::vector<models::OrderItem> items;
                for (const auto &row : result)
                {
                    models::OrderItem item;
                    item.fromSqlRow(row);
                    items.push_back(item);
                }
                LOG_DEBUG("Found {} items for order ID: {}", items.size(), orderId);
                return items;
            })
            .then([](std::exception_ptr eptr) {
                try { std::rethrow_exception(eptr); }
                catch (const drogon::orm::DrogonDbException &e) {
                    throw api::ApiException(std::format("Database error finding order items by order ID: {}", e.what()), drogon::k500InternalServerError, "DB_ERROR");
                }
                catch (...) { throw; }
                return std::vector<models::OrderItem>();
            });
    }

} // namespace dao
```