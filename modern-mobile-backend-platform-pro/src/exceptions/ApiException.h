```cpp
#pragma once

#include <drogon/HttpResponse.h>
#include <string>
#include <exception>

namespace api
{
    /**
     * @brief Base class for custom API exceptions.
     * Inherits from std::exception to allow standard exception handling.
     */
    class ApiException : public std::exception
    {
    protected:
        std::string message_;
        drogon::HttpStatusCode statusCode_;
        std::string errorCode_; // A more specific application-level error code

    public:
        /**
         * @brief Constructor for ApiException.
         * @param message A human-readable error message.
         * @param statusCode The HTTP status code to return.
         * @param errorCode An application-specific error code.
         */
        ApiException(std::string message,
                     drogon::HttpStatusCode statusCode = drogon::k500InternalServerError,
                     std::string errorCode = "INTERNAL_ERROR");

        /**
         * @brief Returns the error message.
         * @return The error message C-string.
         */
        const char *what() const noexcept override;

        /**
         * @brief Get the HTTP status code associated with the exception.
         * @return The HTTP status code.
         */
        drogon::HttpStatusCode statusCode() const;

        /**
         * @brief Get the application-specific error code.
         * @return The error code string.
         */
        const std::string &errorCode() const;

        /**
         * @brief Create a JSON response for this exception.
         * @return A Drogon HttpResponsePtr containing the error details.
         */
        drogon::HttpResponsePtr toJson() const;
    };

    /**
     * @brief Specific exception for bad requests (400).
     */
    class BadRequestException : public ApiException
    {
    public:
        explicit BadRequestException(std::string message = "Bad Request", std::string errorCode = "BAD_REQUEST");
    };

    /**
     * @brief Specific exception for unauthorized access (401).
     */
    class UnauthorizedException : public ApiException
    {
    public:
        explicit UnauthorizedException(std::string message = "Unauthorized", std::string errorCode = "UNAUTHORIZED");
    };

    /**
     * @brief Specific exception for forbidden access (403).
     */
    class ForbiddenException : public ApiException
    {
    public:
        explicit ForbiddenException(std::string message = "Forbidden", std::string errorCode = "FORBIDDEN");
    };

    /**
     * @brief Specific exception for not found resources (404).
     */
    class NotFoundException : public ApiException
    {
    public:
        explicit NotFoundException(std::string message = "Not Found", std::string errorCode = "NOT_FOUND");
    };

    /**
     * @brief Specific exception for conflict errors (409), e.g., unique constraint violation.
     */
    class ConflictException : public ApiException
    {
    public:
        explicit ConflictException(std::string message = "Conflict", std::string errorCode = "CONFLICT");
    };

    /**
     * @brief Specific exception for unprocessable entity errors (422), e.g., validation failures.
     */
    class UnprocessableEntityException : public ApiException
    {
    public:
        explicit UnprocessableEntityException(std::string message = "Unprocessable Entity", std::string errorCode = "UNPROCESSABLE_ENTITY");
    };

} // namespace api
```