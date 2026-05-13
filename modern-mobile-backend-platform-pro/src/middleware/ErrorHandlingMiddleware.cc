```cpp
#include "ErrorHandlingMiddleware.h"
#include "src/exceptions/ApiException.h"
#include "src/utils/Logger.h"
#include <exception> // For std::current_exception

namespace middleware
{
    void ErrorHandlingMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                           drogon::FilterCallback &&callback,
                                           drogon::FilterChainCallback &&fc)
    {
        try
        {
            // Pass control to the next filter/controller
            fc();
        }
        catch (const api::ApiException &e)
        {
            // Custom API exception caught
            LOG_WARN("API Exception caught for request {}: {} (Status: {}, Code: {})",
                     req->getPath(), e.what(), (int)e.statusCode(), e.errorCode());
            callback(e.toJson());
        }
        catch (const std::exception &e)
        {
            // Standard C++ exception caught
            LOG_ERROR("Unhandled standard exception caught for request {}: {}", req->getPath(), e.what());
            Json::Value root;
            root["error"] = "INTERNAL_SERVER_ERROR";
            root["message"] = "An unexpected error occurred.";
            // In development, you might include e.what()
            // root["details"] = e.what();
            auto resp = drogon::HttpResponse::newHttpJsonResponse(root);
            resp->setStatusCode(drogon::k500InternalServerError);
            callback(resp);
        }
        catch (...)
        {
            // Catch-all for any other unhandled exceptions
            LOG_CRITICAL("Unknown unhandled exception caught for request {}.", req->getPath());
            Json::Value root;
            root["error"] = "INTERNAL_SERVER_ERROR";
            root["message"] = "An unknown unexpected error occurred.";
            auto resp = drogon::HttpResponse::newHttpJsonResponse(root);
            resp->setStatusCode(drogon::k500InternalServerError);
            callback(resp);
        }
    }

} // namespace middleware
```