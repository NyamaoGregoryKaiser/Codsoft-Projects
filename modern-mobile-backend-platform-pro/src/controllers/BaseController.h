```cpp
#pragma once

#include <drogon/HttpController.h>
#include <drogon/HttpRequest.h>
#include <drogon/HttpResponse.h>
#include <drogon/drogon.h>
#include <json/json.h>
#include <string>
#include <memory>

#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"

namespace controllers
{
    /**
     * @brief Base class for all API controllers.
     * Provides common utilities like JSON parsing, request context access,
     * and a health check endpoint.
     */
    class BaseController
    {
    protected:
        /**
         * @brief Parses the request body as JSON.
         * @param req The HTTP request.
         * @return The parsed Json::Value.
         * @throws api::BadRequestException if the request body is not valid JSON.
         */
        Json::Value parseJsonBody(const drogon::HttpRequestPtr &req) const
        {
            try
            {
                return req->getJsonObject();
            }
            catch (const std::exception &e)
            {
                LOG_WARN("Failed to parse JSON body for request {}: {}", req->getPath(), e.what());
                throw api::BadRequestException("Invalid JSON request body.", "INVALID_JSON_BODY");
            }
        }

        /**
         * @brief Extracts the authenticated user ID from the request context.
         * This assumes AuthMiddleware has run and successfully set 'userId'.
         * @param req The HTTP request.
         * @return The user ID string.
         * @throws api::UnauthorizedException if user ID is not found in context (should not happen if AuthMiddleware is correct).
         */
        std::string getUserIdFromRequest(const drogon::HttpRequestPtr &req) const
        {
            if (req->attributes()->find("userId") == req->attributes()->end())
            {
                LOG_CRITICAL("UserId not found in request context for an authenticated endpoint. AuthMiddleware might be misconfigured.");
                throw api::UnauthorizedException("Authentication required.", "AUTHENTICATION_REQUIRED");
            }
            return req->attributes()->get<std::string>("userId");
        }

        /**
         * @brief Creates a success JSON response.
         * @param data The data to include in the response.
         * @param message An optional success message.
         * @param statusCode The HTTP status code (default: 200 OK).
         * @return A Drogon HttpResponsePtr.
         */
        drogon::HttpResponsePtr createSuccessResponse(const Json::Value &data = Json::Value(),
                                                      const std::string &message = "Success",
                                                      drogon::HttpStatusCode statusCode = drogon::k200OK) const
        {
            Json::Value root;
            root["status"] = "success";
            root["message"] = message;
            root["data"] = data;
            auto resp = drogon::HttpResponse::newHttpJsonResponse(root);
            resp->setStatusCode(statusCode);
            return resp;
        }

        /**
         * @brief Creates an error JSON response.
         * @param statusCode The HTTP status code.
         * @param errorCode An application-specific error code.
         * @param message A human-readable error message.
         * @return A Drogon HttpResponsePtr.
         * @deprecated Use ApiException directly with ErrorHandlingMiddleware.
         */
        drogon::HttpResponsePtr createErrorResponse(drogon::HttpStatusCode statusCode,
                                                    const std::string &errorCode,
                                                    const std::string &message) const
        {
            Json::Value root;
            root["status"] = "error";
            root["error"] = errorCode;
            root["message"] = message;
            auto resp = drogon::HttpResponse::newHttpJsonResponse(root);
            resp->setStatusCode(statusCode);
            return resp;
        }

    public:
        // Define a simple health check endpoint
        METHOD_LIST_BEGIN
        ADD_METHOD_TO(BaseController::healthCheck, "/api/v1/health", drogon::Get, {middleware::ErrorHandlingMiddleware});
        METHOD_LIST_END

        /**
         * @brief Handles health check requests.
         * @param req The HTTP request.
         * @param callback The callback to send the response.
         */
        void healthCheck(const drogon::HttpRequestPtr &req, drogon::HttpCallback &&callback) const
        {
            Json::Value data;
            data["status"] = "UP";
            data["timestamp"] = drogon::orm::Field<drogon::orm::time_point>(std::chrono::system_clock::now()).asSqlString();
            callback(createSuccessResponse(data, "Service is healthy!"));
        }
    };
} // namespace controllers
```