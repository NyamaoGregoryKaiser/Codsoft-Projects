```cpp
#include "ErrorHandler.h"
#include "core/utils/Logger.h"
#include <nlohmann/json.hpp>
#include <stdexcept>

using namespace Pistache;
using namespace nlohmann;

void ErrorHandler::handle(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        // This is a middleware, so if an exception propagates up to here, it means
        // a handler or prior middleware threw an exception.
        // Pistache's default error handling will typically catch these, but this allows
        // for custom logging and response formatting.
        // However, Pistache's `handle` is called *before* the route handler.
        // To catch errors *from* the route handler, we typically rely on Pistache's
        // endpoint exception handling or use try-catch blocks in each controller.
        // For simplicity and demonstration, if an exception reaches this point,
        // it's likely a misconfiguration or a bug in a previous middleware.
        // Proper error handling often wraps the handler call in a try/catch.

        // A better approach for global error handling is to wrap the dispatcher call in main:
        // try { router.route(request, response); } catch (...) { ErrorHandler::handle(...); }
        // Pistache's `setHandler` does this implicitly.

        // For now, if the request reaches here *after* some error,
        // it implies that a response has not been sent yet.
        // We'll log the fact that we're falling back to a generic 500.
        Logger::error("ErrorHandler::handle triggered for path: {}. Potential unhandled exception upstream.", request.resource());
        response.send(Http::Code::Internal_Server_Error, json({{"message", "An internal server error occurred"}}).dump());

    } catch (const std::exception& e) {
        // Fallback for any error during error handling itself
        Logger::critical("ErrorHandler::handle - Exception during error handling: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", "An unrecoverable error occurred during error processing"}}).dump());
    }
}

void ErrorHandler::notFound(const Rest::Request& request, Http::ResponseWriter response) {
    Logger::warn("404 Not Found: {} {}", request.method(), request.resource());
    response.send(Http::Code::Not_Found, json({{"message", "Endpoint not found"}}).dump(), MIME(Application, Json));
}
```