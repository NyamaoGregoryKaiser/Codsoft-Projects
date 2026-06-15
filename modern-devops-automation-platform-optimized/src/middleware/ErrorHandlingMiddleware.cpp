```cpp
#include "ErrorHandlingMiddleware.h"
#include "../utils/Logger.h"
#include <drogon/HttpResponse.h>
#include <drogon/drogon.h>
#include <Poco/JSON/Object.h>

using namespace drogon;
using namespace drogon::filter;

void ErrorHandlingMiddleware::doFilter(const HttpRequestPtr &req,
                                       FilterCallback &&fcb,
                                       FilterChainCallback &&fccb) {
    // This filter is usually the first in the chain to wrap the entire request processing
    // It calls the next filter/controller and catches any exceptions.
    try {
        fccb(); // Execute the rest of the filter chain and controller
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "DB Exception caught in ErrorHandlingMiddleware for path " << req->getPath() << ": " << e.what();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Database Error");
        errJson.set("message", std::string("A database operation failed: ") + e.what());
        resp->setBody(errJson.toString());
        fcb(resp);
    } catch (const std::runtime_error& e) {
        // Catch custom runtime errors, e.g., "Product with name already exists"
        LOG_ERROR << "Runtime Error caught in ErrorHandlingMiddleware for path " << req->getPath() << ": " << e.what();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest); // Use 400 for client-side errors
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Bad Request");
        errJson.set("message", e.what());
        resp->setBody(errJson.toString());
        fcb(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Unhandled Exception caught in ErrorHandlingMiddleware for path " << req->getPath() << ": " << e.what();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Internal Server Error");
        errJson.set("message", "An unexpected error occurred: " + std::string(e.what()));
        resp->setBody(errJson.toString());
        fcb(resp);
    } catch (...) {
        LOG_FATAL << "Unknown Exception caught in ErrorHandlingMiddleware for path " << req->getPath();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        Poco::JSON::Object errJson;
        errJson.set("error", "Internal Server Error");
        errJson.set("message", "An unknown error occurred.");
        resp->setBody(errJson.toString());
        fcb(resp);
    }
}
```