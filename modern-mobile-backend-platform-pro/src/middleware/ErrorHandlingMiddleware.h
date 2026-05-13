```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/HttpFilter.h>

namespace middleware
{
    /**
     * @brief Global error handling middleware for Drogon.
     * Catches exceptions thrown by controllers/services and converts them into
     * appropriate HTTP responses.
     */
    class ErrorHandlingMiddleware : public drogon::HttpFilter<ErrorHandlingMiddleware>
    {
    public:
        /**
         * @brief Filter method that wraps the next handler in a try-catch block.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         * @param fc The filter chain to pass control to the next handler.
         */
        void doFilter(const drogon::HttpRequestPtr &req,
                      drogon::FilterCallback &&callback,
                      drogon::FilterChainCallback &&fc) override;
    };

} // namespace middleware
```