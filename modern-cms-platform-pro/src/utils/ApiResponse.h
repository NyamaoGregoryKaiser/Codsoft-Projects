#pragma once

#include <drogon/HttpResponse.h>
#include <json/json.h>
#include <string>

// Helper functions for consistent API responses
class ApiResponse {
public:
    static drogon::HttpResponsePtr createResponse(drogon::HttpStatusCode status,
                                                   const std::string& message,
                                                   const Json::Value& data = Json::nullValue) {
        Json::Value responseJson;
        responseJson["status"] = (status >= drogon::HttpStatusCode::k200OK && status < drogon::HttpStatusCode::k300OK) ? "success" : "error";
        responseJson["code"] = static_cast<int>(status);
        responseJson["message"] = message;
        if (!data.isNull()) {
            responseJson["data"] = data;
        }

        auto resp = drogon::HttpResponse::newHttpJsonResponse(responseJson);
        resp->setStatusCode(status);
        return resp;
    }

    static drogon::HttpResponsePtr ok(const std::string& message = "Success",
                                       const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k200OK, message, data);
    }

    static drogon::HttpResponsePtr created(const std::string& message = "Created",
                                            const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k201Created, message, data);
    }

    static drogon::HttpResponsePtr noContent(const std::string& message = "No Content") {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::HttpStatusCode::k204NoContent);
        return resp;
    }

    static drogon::HttpResponsePtr badRequest(const std::string& message = "Bad Request",
                                               const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k400BadRequest, message, data);
    }

    static drogon::HttpResponsePtr unauthorized(const std::string& message = "Unauthorized",
                                                  const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k401Unauthorized, message, data);
    }

    static drogon::HttpResponsePtr forbidden(const std::string& message = "Forbidden",
                                               const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k403Forbidden, message, data);
    }

    static drogon::HttpResponsePtr notFound(const std::string& message = "Not Found",
                                              const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k404NotFound, message, data);
    }

    static drogon::HttpResponsePtr conflict(const std::string& message = "Conflict",
                                            const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k409Conflict, message, data);
    }

    static drogon::HttpResponsePtr tooManyRequests(const std::string& message = "Too Many Requests",
                                                     const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k429TooManyRequests, message, data);
    }

    static drogon::HttpResponsePtr internalError(const std::string& message = "Internal Server Error",
                                                  const Json::Value& data = Json::nullValue) {
        return createResponse(drogon::HttpStatusCode::k500InternalServerError, message, data);
    }
};