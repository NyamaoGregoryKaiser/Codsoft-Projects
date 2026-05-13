```cpp
#include "ApiException.h"
#include <drogon/drogon.h>

namespace api
{
    ApiException::ApiException(std::string message, drogon::HttpStatusCode statusCode, std::string errorCode)
        : message_(std::move(message)), statusCode_(statusCode), errorCode_(std::move(errorCode))
    {
    }

    const char *ApiException::what() const noexcept
    {
        return message_.c_str();
    }

    drogon::HttpStatusCode ApiException::statusCode() const
    {
        return statusCode_;
    }

    const std::string &ApiException::errorCode() const
    {
        return errorCode_;
    }

    drogon::HttpResponsePtr ApiException::toJson() const
    {
        Json::Value root;
        root["error"] = errorCode_;
        root["message"] = message_;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(root);
        resp->setStatusCode(statusCode_);
        return resp;
    }

    BadRequestException::BadRequestException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k400BadRequest, std::move(errorCode)) {}

    UnauthorizedException::UnauthorizedException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k401Unauthorized, std::move(errorCode)) {}

    ForbiddenException::ForbiddenException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k403Forbidden, std::move(errorCode)) {}

    NotFoundException::NotFoundException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k404NotFound, std::move(errorCode)) {}

    ConflictException::ConflictException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k409Conflict, std::move(errorCode)) {}

    UnprocessableEntityException::UnprocessableEntityException(std::string message, std::string errorCode)
        : ApiException(std::move(message), drogon::k422UnprocessableEntity, std::move(errorCode)) {}

} // namespace api
```