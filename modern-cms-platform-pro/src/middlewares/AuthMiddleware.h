#pragma once

#include <drogon/HttpFilter.h>
#include <json/json.h>
#include <string>

// Represents user info extracted from JWT
struct AuthUser {
    std::string id;
    std::string username;
    std::string role;
};

class AuthMiddleware : public drogon::HttpFilter<AuthMiddleware> {
public:
    AuthMiddleware() = default;

    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fcc);
};