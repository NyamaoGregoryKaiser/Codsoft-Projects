```cpp
#pragma once

#include <drogon/HttpFilter.h>

namespace drogon
{
namespace filter
{
// Global error handling middleware
// This will catch exceptions thrown by controllers/services and format responses
class ErrorHandlingMiddleware : public HttpFilter<ErrorHandlingMiddleware>
{
  public:
    ErrorHandlingMiddleware() = default;
    void doFilter(const HttpRequestPtr &req,
                  FilterCallback &&fcb,
                  FilterChainCallback &&fccb) override;
};
} // namespace filter
} // namespace drogon
```