#include "LoggingMiddleware.h"
#include "spdlog/spdlog.h"
#include <chrono>

void LoggingMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    // Store request start time in context (or use a global map indexed by request ID if not using Crow's context)
    auto start_time = std::chrono::high_resolution_clock::now();
    req.add_context<std::chrono::high_resolution_clock::time_point>(start_time);

    spdlog::info("Incoming Request: {} {} from {}", req.method_string(), req.url, req.remote_ip_address);
}

void LoggingMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // Retrieve start time
    auto& start_time = req.get_context<std::chrono::high_resolution_clock::time_point>();
    if (start_time.has_value()) {
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time.value()).count();
        spdlog::info("Outgoing Response: {} {} - Status {} ({} ms)", req.method_string(), req.url, res.code, duration);
    } else {
        spdlog::warn("Request start time not found in context for {}", req.url);
        spdlog::info("Outgoing Response: {} {} - Status {}", req.method_string(), req.url, res.code);
    }
}
```