```cpp
#include "AuthController.h"

// Constructor for dependency injection
AuthController::AuthController(AuthService authService) : authService(std::move(authService)) {}

void AuthController::registerUser(const drogon::HttpRequestPtr& req,
                                  std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_INFO("Received POST /auth/register request.");
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("username") || !json->isMember("email") || !json->isMember("password")) {
            throw Common::ApiException(400, "Missing required fields: username, email, and password.");
        }

        std::string username = (*json)["username"].asString();
        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();

        drogon::app().get==
        drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
            try {
                auto [user, token] = co_await authService.registerUser(username, email, password);

                Json::Value resp_json;
                resp_json["message"] = "User registered successfully";
                resp_json["user_id"] = user.id;
                resp_json["token"] = token;

                resp->setStatusCode(drogon::k201Created);
                resp->setBody(resp_json.toStyledString());
            } catch (const Common::ApiException& e) {
                Json::Value err;
                err["code"] = e.statusCode;
                err["message"] = e.what();
                resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
                resp->setBody(err.toStyledString());
            } catch (const std::exception& e) {
                LOG_ERROR("Unhandled exception in registerUser: {}", e.what());
                Json::Value err;
                err["code"] = 500;
                err["message"] = "Internal server error.";
                resp->setStatusCode(drogon::k500InternalServerError);
                resp->setBody(err.toStyledString());
            }
            callback(resp);
        });

    } catch (const Common::ApiException& e) {
        Json::Value err;
        err["code"] = e.statusCode;
        err["message"] = e.what();
        resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
        resp->setBody(err.toStyledString());
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR("Error parsing JSON in registerUser: {}", e.what());
        Json::Value err;
        err["code"] = 400;
        err["message"] = "Invalid JSON payload.";
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody(err.toStyledString());
        callback(resp);
    }
}

void AuthController::loginUser(const drogon::HttpRequestPtr& req,
                               std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_INFO("Received POST /auth/login request.");
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->addHeader("Content-Type", "application/json");

    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("email") || !json->isMember("password")) {
            throw Common::ApiException(400, "Missing required fields: email and password.");
        }

        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();

        drogon::app().getTaskScheduler()->runInCoroutine([=, this]() mutable {
            try {
                auto [user, token] = co_await authService.loginUser(email, password);

                Json::Value resp_json;
                resp_json["message"] = "Login successful";
                resp_json["user_id"] = user.id;
                resp_json["token"] = token;

                resp->setStatusCode(drogon::k200OK);
                resp->setBody(resp_json.toStyledString());
            } catch (const Common::ApiException& e) {
                Json::Value err;
                err["code"] = e.statusCode;
                err["message"] = e.what();
                resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
                resp->setBody(err.toStyledString());
            } catch (const std::exception& e) {
                LOG_ERROR("Unhandled exception in loginUser: {}", e.what());
                Json::Value err;
                err["code"] = 500;
                err["message"] = "Internal server error.";
                resp->setStatusCode(drogon::k500InternalServerError);
                resp->setBody(err.toStyledString());
            }
            callback(resp);
        });

    } catch (const Common::ApiException& e) {
        Json::Value err;
        err["code"] = e.statusCode;
        err["message"] = e.what();
        resp->setStatusCode((drogon::HttpStatusCode)e.statusCode);
        resp->setBody(err.toStyledString());
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR("Error parsing JSON in loginUser: {}", e.what());
        Json::Value err;
        err["code"] = 400;
        err["message"] = "Invalid JSON payload.";
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody(err.toStyledString());
        callback(resp);
    }
}
```