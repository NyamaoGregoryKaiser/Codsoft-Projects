```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <json/json.h> // For Json::Value

namespace ApexContent::Filter {

// Custom data to pass to controller after successful authentication
struct AuthData {
    int userId;
    std::string username;
    std::vector<std::string> roles;
    Json::Value claims; // Original JWT claims
};

class AuthFilter : public drogon::HttpFilter<AuthFilter> {
public:
    AuthFilter() {}
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fccb) override;

    // Helper to get auth data from request context
    static std::optional<AuthData> getAuthData(const drogon::HttpRequestPtr& req);
};

} // namespace ApexContent::Filter
```