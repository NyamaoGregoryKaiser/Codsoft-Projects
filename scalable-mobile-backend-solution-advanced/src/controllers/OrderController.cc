```cpp
#include "OrderController.h"

OrderController::OrderController(OrderService orderService) : orderService(std::move(orderService)) {}

void OrderController::getAllOrders(const drogon::HttpRequestPtr& req,
                                   std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                   long limit, long offset) {
    LOG_INFO("Received GET /orders request. Limit: {}, Offset: {}", limit, offset);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::string authenticatedUserId = req->attributes()->get<std::string>("user_id");
            Json::Value userRoles = req->attributes()->get<Json::Value>("user_roles");
            bool isAdmin = false;
            for(const auto& role : userRoles) {
                if (role.asString() == "admin") {
                    isAdmin = true;
                    break;
                }
            }

            std::vector<Order> orders;
            if (isAdmin) {
                orders = co_await orderService.getAllOrders(limit, offset);
            } else {
                orders = co_await orderService.getOrdersByUserId(authenticatedUserId, limit, offset);
            }

            Json::Value resp_json(Json::arrayValue);
            for (const auto& order : orders) {
                resp_json.append(order.toJson());
            }

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in getAllOrders: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void OrderController::getOrderById(const drogon::HttpRequestPtr& req,
                                   std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                   const std::string& id) {
    LOG_INFO("Received GET /orders/{} request.", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::string authenticatedUserId = req->attributes()->get<std::string>("user_id");
            Json::Value userRoles = req->attributes()->get<Json::Value>("user_roles");
            bool isAdmin = false;
            for(const auto& role : userRoles) {
                if (role.asString() == "admin") {
                    isAdmin = true;
                    break;
                }
            }

            std::optional<Order> orderOpt = co_await orderService.getOrderById(id);
            if (!orderOpt) {
                throw Common::ApiException(404, "Order not found.");
            }
            Order order = orderOpt.value();

            if (order.user_id != authenticatedUserId && !isAdmin) {
                throw Common::ApiException(403, "Forbidden: Not authorized to view this order.");
            }

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(order.toJson().toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in getOrderById: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void OrderController::createOrder(const drogon::HttpRequestPtr& req,
                                  std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_INFO("Received POST /orders request (User: {}).", req->attributes()->get<std::string>("user_id"));
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::string authenticatedUserId = req->attributes()->get<std::string>("user_id");
            auto json = req->getJsonObject();
            if (!json || !json->isMember("items") || !(*json)["items"].isArray()) {
                throw Common::ApiException(400, "Missing or invalid 'items' array in payload.");
            }

            std::vector<std::pair<UUID, int>> requestedItems;
            for (const auto& itemJson : (*json)["items"]) {
                if (!itemJson.isMember("product_id") || !itemJson.isMember("quantity")) {
                    throw Common::ApiException(400, "Each item must have 'product_id' and 'quantity'.");
                }
                requestedItems.push_back({itemJson["product_id"].asString(), itemJson["quantity"].asInt()});
            }

            Order createdOrder = co_await orderService.createOrder(authenticatedUserId, requestedItems);

            Json::Value resp_json;
            resp_json["message"] = "Order created successfully";
            resp_json["order"] = createdOrder.toJson();

            resp->setStatusCode(drogon::k201Created);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in createOrder: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void OrderController::updateOrderStatus(const drogon::HttpRequestPtr& req,
                                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                        const std::string& id) {
    LOG_INFO("Received PATCH /orders/{}/status request (Admin).", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            auto json = req->getJsonObject();
            if (!json || !json->isMember("status")) {
                throw Common::ApiException(400, "Missing required field: status.");
            }

            std::string newStatus = (*json)["status"].asString();
            
            Order updatedOrder = co_await orderService.updateOrderStatus(id, newStatus);