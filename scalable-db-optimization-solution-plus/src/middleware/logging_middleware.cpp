```cpp
#include "logging_middleware.h"

namespace middleware {

LoggingMiddleware::LoggingMiddleware() {}

void LoggingMiddleware::before_handle(crow::request& req, crow::response& /*res*/, crow::context& ctx) {
    ctx.set<std::chrono::high_resolution_clock::time_point>("start_time", std::chrono::high_resolution_clock::now());
    LOG_INFO("REQ: {} {} from {}", req.method_string(), req.url, req.remote_ip_address);
}

void LoggingMiddleware::after_handle(crow::request& req, crow::response& res, crow::context& ctx) {
    auto start_time = ctx.get<std::chrono::high_resolution_clock::time_point>("start_time");
    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();
    LOG_INFO("RES: {} {} - {} {}ms", req.method_string(), req.url, res.code, duration);
}

} // namespace middleware
```