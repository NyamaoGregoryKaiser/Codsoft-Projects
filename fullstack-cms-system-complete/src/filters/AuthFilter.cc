```cpp
#include "AuthFilter.h"
#include "utils/JwtManager.h"
#include "utils/Logger.h"
#include <drogon/drogon.h>
#include <drogon/HttpAppFramework.h>

namespace ApexContent::Filter {

void AuthFilter::doFilter(const drogon::HttpRequestPtr& req,
                          drogon::FilterCallback &&fcb,
                          drogon::FilterChainCallback &&fccb) {
    
    // Skip authentication for public routes (e.g., login, register, static files)
    if (req->path() == "/api/v1/auth/login" || 
        req->path() == "/api/v1/auth/register" ||
        req->path().rfind("/static/", 0) == 0 || // Paths starting with /static/
        req->path().rfind("/views/", 0) == 0 ||  // Paths starting with /views/
        req->path() == "/") { // Root path might serve a basic page
        fccb(); // Continue to next filter/controller
        return;
    }

    const std::string& authHeader = req->getHeader("Authorization");

    if (authHeader.empty() || authHeader.rfind("Bearer ", 0) != 0) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody("Unauthorized: Missing or invalid Authorization header");
        LOG_WARN << "Unauthorized access attempt: Missing/invalid Authorization header on " << req->path();
        fcb(resp);
        return;
    }

    std::string token = authHeader.substr(7); // Remove "Bearer "
    auto claims = ApexContent::Utils::JwtManager::verifyAccessToken(token);

    if (!claims) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k401Unauthorized);
        resp->setBody("Unauthorized: Invalid or expired token");
        LOG_WARN << "Unauthorized access attempt: Invalid/expired token on " << req->path();
        fcb(resp);
        return;
    }

    // Authentication successful, store claims in request context
    AuthData authData;
    authData.userId = claims.value()["userId"].asInt();
    authData.username = claims.value()["username"].asString();
    
    // Parse roles
    if (claims.value().isMember("roles") && claims.value()["roles"].isArray()) {
        for (const auto& role : claims.value()["roles"]) {
            authData.roles.push_back(role.asString());
        }
    } else {
        LOG_WARN << "JWT claims for user " << authData.username << " does not contain roles.";
    }
    
    authData.claims = claims.value();

    req->attributes()->insert("auth_data", authData);
    LOG_DEBUG << "User " << authData.username << " authenticated for " << req->path();
    fccb(); // Continue to next filter/controller
}

std::optional<AuthData> AuthFilter::getAuthData(const drogon::HttpRequestPtr& req) {
    if (req->attributes()->find("auth_data") != req->attributes()->end()) {
        return req->attributes()->get<AuthData>("auth_data");
    }
    return std::nullopt;
}

} // namespace ApexContent::Filter
```