```cpp
#include "AuthMiddleware.h"
#include "../utils/Logger.h"
#include "../utils/JwtManager.h"
#include <drogon/HttpResponse.h>
#include <Poco/String.h>

using namespace drogon;
using namespace drogon::filter;

// Key for storing user info in the request context
const static std::string USER_INFO_KEY = "auth_user_info";

void AuthMiddleware::doFilter(const HttpRequestPtr &req,
                              FilterCallback &&fcb,
                              FilterChainCallback &&fccb) {
    LOG_TRACE << "AuthMiddleware: Processing request to " << req->getPath();

    // Skip authentication for login endpoint
    if (req->getPath() == "/api/v1/auth/login") {
        fccb(); // Continue to next filter/controller
        return;
    }

    // Get Authorization header
    const std::string& authHeader = req->getHeader("Authorization");

    if (authHeader.empty()) {
        LOG_WARN << "AuthMiddleware: No Authorization header provided.";
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Unauthorized");
        errJson.set("message", "Missing Authorization header.");
        resp->setBody(errJson.toString());
        fcb(resp); // Stop processing, send unauthorized response
        return;
    }

    // Expect "Bearer <token>"
    if (!Poco::String::startsWith(authHeader, "Bearer ")) {
        LOG_WARN << "AuthMiddleware: Invalid Authorization header format.";
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Unauthorized");
        errJson.set("message", "Invalid Authorization header format. Expected 'Bearer <token>'.");
        resp->setBody(errJson.toString());
        fcb(resp);
        return;
    }

    std::string token = authHeader.substr(7); // Extract token after "Bearer "

    // Verify JWT token
    Poco::JSON::Object::Ptr payload = AppUtils::JwtManager::getInstance().verifyToken(token);

    if (!payload) {
        LOG_WARN << "AuthMiddleware: Invalid or expired JWT token.";
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Unauthorized");
        errJson.set("message", "Invalid or expired authentication token.");
        resp->setBody(errJson.toString());
        fcb(resp);
        return;
    }

    // Store user info in request context for later access by controllers
    req->setContext(USER_INFO_KEY, payload);
    LOG_DEBUG << "AuthMiddleware: Token verified. User ID: " << payload->getValue<std::string>("userId");

    fccb(); // Continue to next filter/controller
}

Poco::JSON::Object::Ptr AuthMiddleware::getUserInfo(const HttpRequestPtr &req) {
    if (req->hasContext(USER_INFO_KEY)) {
        return req->getContext<Poco::JSON::Object::Ptr>(USER_INFO_KEY);
    }
    return nullptr;
}

```