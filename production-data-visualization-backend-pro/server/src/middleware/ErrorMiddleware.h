#pragma once

#include <crow.h>
#include "common/Error.h"
#include "utils/Logger.h"

namespace DataVizPro {
    struct ErrorMiddleware {
        struct context {};

        void before_handle(crow::request& req, crow::response& res, context& ctx) {
            // No action needed before
        }

        void after_handle(crow::request& req, crow::response& res, context& ctx) {
            // This is primarily for catching errors that bubble up from handlers
            // or setting default headers, etc.
            // Crow's error handling for exceptions is typically done via app.handle_exceptions
            // However, we can use this for post-processing or ensuring consistent error responses.
        }

        void after_start(crow::App<ErrorMiddleware>& app) {
            app.handle_exceptions([&](const crow::request& req, crow::response& res, std::exception_ptr ep) {
                try {
                    std::rethrow_exception(ep);
                } catch (const DataVizError& dve) {
                    res.code = dve.http_status;
                    res.set_header("Content-Type", "application/json");
                    res.write(dve.toJson().dump());
                    LOG_ERROR("DataVizError caught: {} (Code: {}, HTTP: {}) on path {}", dve.what(), static_cast<int>(dve.code), dve.http_status, req.url);
                } catch (const std::exception& e) {
                    res.code = 500;
                    res.set_header("Content-Type", "application/json");
                    nlohmann::json j;
                    j["error"] = {
                        {"code", static_cast<int>(ErrorCode::UNKNOWN_ERROR)},
                        {"message", "An unexpected error occurred"},
                        {"details", e.what()}
                    };
                    res.write(j.dump());
                    LOG_CRITICAL("Unhandled standard exception caught: {} on path {}", e.what(), req.url);
                } catch (...) {
                    res.code = 500;
                    res.set_header("Content-Type", "application/json");
                    nlohmann::json j;
                    j["error"] = {
                        {"code", static_cast<int>(ErrorCode::UNKNOWN_ERROR)},
                        {"message", "An unknown and unhandled error occurred"}
                    };
                    res.write(j.dump());
                    LOG_CRITICAL("Unhandled unknown exception caught on path {}", req.url);
                }
                res.end();
            });
        }
    };
} // namespace DataVizPro
```