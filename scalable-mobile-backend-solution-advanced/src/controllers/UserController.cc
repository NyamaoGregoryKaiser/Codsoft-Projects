```cpp
#include "UserController.h"

UserController::UserController(UserService userService) : userService(std::move(userService)) {}

void UserController::getAllUsers(const drogon::HttpRequestPtr& req,
                               std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                               long limit, long offset) {
    LOG_INFO("Received GET /users request. Limit: {}, Offset: {}", limit, offset);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            std::vector<User> users = co_await userService.getAllUsers(limit, offset);

            Json::Value resp_json(Json::arrayValue);
            for (const auto& user : users) {
                resp_json.append(user.toJson());
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
            LOG_ERROR("Unhandled exception in getAllUsers: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void UserController::getUserById(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                 const std::string& id) {
    LOG_INFO("Received GET /users/{} request.", id);
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

            if (id != authenticatedUserId && !isAdmin) {
                throw Common::ApiException(403, "Forbidden: Not authorized to view this user's profile.");
            }

            std::optional<User> userOpt = co_await userService.getUserById(id);
            if (!userOpt) {
                throw Common::ApiException(404, "User not found.");
            }

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(userOpt.value().toJson().toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in getUserById: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void UserController::updateUser(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                const std::string& id) {
    LOG_INFO("Received PATCH /users/{} request.", id);
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

            if (id != authenticatedUserId && !isAdmin) {
                throw Common::ApiException(403, "Forbidden: Not authorized to update this user's profile.");
            }

            auto json = req->getJsonObject();
            if (!json) {
                throw Common::ApiException(400, "Invalid JSON payload.");
            }

            std::optional<std::string> username, email, password;
            if (json->isMember("username")) username = (*json)["username"].asString();
            if (json->isMember("email")) email = (*json)["email"].asString();
            if (json->isMember("password")) password = (*json)["password"].asString();

            User updatedUser = co_await userService.updateUser(id, username, email, password);

            Json::Value resp_json;
            resp_json["message"] = "User updated successfully";
            resp_json["user"] = updatedUser.toJson(); // Return updated user data

            resp->setStatusCode(drogon::k200OK);
            resp->setBody(resp_json.toStyledString());
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in updateUser: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}

void UserController::deleteUser(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                const std::string& id) {
    LOG_INFO("Received DELETE /users/{} request.", id);
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
        try {
            // AuthFilter::admin already ensures admin role.
            // Check if admin is trying to delete themselves.
            std::string authenticatedUserId = req->attributes()->get<std::string>("user_id");
            if (id == authenticatedUserId) {
                 throw Common::ApiException(400, "Bad Request: An admin cannot delete their own account.");
            }

            co_await userService.deleteUser(id);

            resp->setStatusCode(drogon::k204NoContent); // No content on successful delete
        } catch (const Common::ApiException& e) {
            Json::Value err;
            err["code"] = e.statusCode;
            err["message"] = e.what();
            resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
            resp->setBody(err.toStyledString());
        } catch (const std::exception& e) {
            LOG_ERROR("Unhandled exception in deleteUser: {}", e.what());
            Json::Value err;
            err["code"] = 500;
            err["message"] = "Internal server error.";
            resp->setStatusCode(drogon::k500InternalServerError);
            resp->setBody(err.toStyledString());
        }
        callback(resp);
    });
}
```