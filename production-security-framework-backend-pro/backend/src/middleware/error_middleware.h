#pragma once

#include <crow.h>
#include <nlohmann/json.hpp>
#include "../utils/logger.h"
#include "../utils/custom_exceptions.h"

namespace Middleware {

struct ErrorHandler {
    struct context {}; // No shared context needed for this middleware

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // No pre-processing needed for error handling
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // This middleware primarily acts as an exception catcher,
        // so it doesn't need to do much after successful handling.
    }

    void handle_error(crow::request& req, crow::response& res, std::exception_ptr ep, context& ctx) {
        try {
            if (ep) {
                std::rethrow_exception(ep);
            }
        } catch (const CustomExceptions::ApiException& e) {
            LOG_WARN("API Exception caught: {}. Status: {}, Code: {}", e.what(), e.getHttpStatus(), static_cast<int>(e.getErrorCode()));
            res.code = e.getHttpStatus();
            nlohmann::json error_json;
            error_json["message"] = e.what();
            error_json["code"] = static_cast<int>(e.getErrorCode());
            res.write(error_json.dump());
        } catch (const std::runtime_error& e) {
            LOG_ERROR("Runtime error caught: {}", e.what());
            res.code = 500;
            nlohmann::json error_json;
            error_json["message"] = "An unexpected internal server error occurred.";
            error_json["code"] = static_cast<int>(CustomExceptions::ApiException::ErrorCode::INTERNAL_SERVER_ERROR);
            LOG_ERROR("Request path: {}, error: {}", req.url, e.what());
            res.write(error_json.dump());
        } catch (const std::exception& e) {
            LOG_CRITICAL("Unknown exception caught: {}", e.what());
            res.code = 500;
            nlohmann::json error_json;
            error_json["message"] = "An unknown internal server error occurred.";
            error_json["code"] = static_cast<int>(CustomExceptions::ApiException::ErrorCode::UNKNOWN_ERROR);
            LOG_CRITICAL("Request path: {}, error: {}", req.url, e.what());
            res.write(error_json.dump());
        } catch (...) {
            LOG_CRITICAL("Completely unknown exception caught.");
            res.code = 500;
            nlohmann::json error_json;
            error_json["message"] = "A catastrophic unknown error occurred.";
            error_json["code"] = static_cast<int>(CustomExceptions::ApiException::ErrorCode::UNKNOWN_ERROR);
            LOG_CRITICAL("Request path: {}", req.url);
            res.write(error_json.dump());
        }
        res.set_header("Content-Type", "application/json");
        res.end();
    }
};

} // namespace Middleware