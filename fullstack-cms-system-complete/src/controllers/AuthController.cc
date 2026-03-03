```cpp
#include "AuthController.h"
#include "services/AuthService.h"
#include "utils/Logger.h"

namespace ApexContent::Controller {

void AuthController::login(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_DEBUG << "AuthController::login called.";
    Json::Value json;
    try {
        json = *(req->get                    ());
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Invalid JSON body.");
        callback(resp);
        return;
    }

    if (!json.isMember("username") || !json.isMember("password")) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Missing username or password.");
        callback(resp);
        return;
    }

    std::string username = json["username"].asString();
    std::string password = json["password"].asString();

    try {
        auto [accessToken, refreshToken] = ApexContent::Service::AuthService::login(username, password);
        Json::Value respJson;
        respJson["access_token"] = accessToken;
        respJson["refresh_token"] = refreshToken;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(respJson);
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        if (std::string(e.what()) == "Invalid credentials") {
            resp->setStatusCode(drogon::k401Unauthorized);
        } else {
            resp->setStatusCode(drogon::k500InternalServerError);
        }
        resp->setBody(e.what());
        callback(resp);
    } catch (...) {
        LOG_ERROR << "Unknown error during login for user " << username;
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody("An unexpected error occurred.");
        callback(resp);
    }
}

void AuthController::registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_DEBUG << "AuthController::registerUser called.";
    Json::Value json;
    try {
        json = *(req->get                    ());
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Invalid JSON body.");
        callback(resp);
        return;
    }

    if (!json.isMember("username") || !json.isMember("email") || !json.isMember("password")) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Missing username, email, or password.");
        callback(resp);
        return;
    }

    std::string username = json["username"].asString();
    std::string email = json["email"].asString();
    std::string password = json["password"].asString();

    try {
        auto [accessToken, refreshToken] = ApexContent::Service::AuthService::registerUser(username, email, password);
        Json::Value respJson;
        respJson["access_token"] = accessToken;
        respJson["refresh_token"] = refreshToken;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(respJson);
        resp->setStatusCode(drogon::k201Created); // 201 Created
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        if (std::string(e.what()).find("already exists") != std::string::npos) {
            resp->setStatusCode(drogon::k409Conflict); // 409 Conflict
        } else {
            resp->setStatusCode(drogon::k500InternalServerError);
        }
        resp->setBody(e.what());
        callback(resp);
    } catch (...) {
        LOG_ERROR << "Unknown error during user registration for " << username;
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody("An unexpected error occurred.");
        callback(resp);
    }
}

void AuthController::refresh(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_DEBUG << "AuthController::refresh called.";
    Json::Value json;
    try {
        json = *(req->get                    ());
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Invalid JSON body.");
        callback(resp);
        return;
    }

    if (!json.isMember("refresh_token")) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Missing refresh_token.");
        callback(resp);
        return;
    }

    std::string refreshToken = json["refresh_token"].asString();

    try {
        auto [newAccessToken, newRefreshToken] = ApexContent::Service::AuthService::refreshTokens(refreshToken);
        Json::Value respJson;
        respJson["access_token"] = newAccessToken;
        respJson["refresh_token"] = newRefreshToken;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(respJson);
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    } catch (const std::runtime_error& e) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody(e.what());
        callback(resp);
    } catch (...) {
        LOG_ERROR << "Unknown error during token refresh.";
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        resp->setBody("An unexpected error occurred.");
        callback(resp);
    }
}

} // namespace ApexContent::Controller
```