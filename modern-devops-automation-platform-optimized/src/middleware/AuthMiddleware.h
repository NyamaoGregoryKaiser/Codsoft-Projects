```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include <Poco/JSON/Object.h>

// Extend drogon namespace for custom filter
namespace drogon
{
namespace filter
{
class AuthMiddleware : public HttpFilter<AuthMiddleware>
{
  public:
    AuthMiddleware() = default;
    void doFilter(const HttpRequestPtr &req,
                  FilterCallback &&fcb,
                  FilterChainCallback &&fccb) override;

    // Helper to get user info from request (after successful auth)
    static Poco::JSON::Object::Ptr getUserInfo(const HttpRequestPtr &req);
};
} // namespace filter
} // namespace drogon
```