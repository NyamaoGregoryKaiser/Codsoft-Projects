#include "ErrorHandlingMiddleware.h"
#include "utils/ApiResponse.h"
#include <drogon/drogon.h>

void ErrorHandlingMiddleware::doFilter(const drogon::HttpRequestPtr &req,
                                      drogon::FilterCallback &&fcb,
                                      drogon::FilterChainCallback &&fcc) {
    LOG_DEBUG << "ErrorHandlingMiddleware: Processing request for path " << req->getPath();

    try {
        fcc(); // Pass control to the next filter/handler
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR << "DB Exception caught in filter: " << e.what() << " for path: " << req->getPath();
        fcb(ApiResponse::internalError("Database error occurred."));
    } catch (const std::exception& e) {
        LOG_ERROR << "Unhandled exception caught in filter: " << e.what() << " for path: " << req->getPath();
        fcb(ApiResponse::internalError("An unexpected error occurred."));
    } catch (...) {
        LOG_ERROR << "Unknown exception caught in filter for path: " << req->getPath();
        fcb(ApiResponse::internalError("An unknown error occurred."));
    }
}