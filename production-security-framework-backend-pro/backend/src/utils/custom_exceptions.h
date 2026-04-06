#pragma once

#include <stdexcept>
#include <string>

namespace CustomExceptions {

// Base exception for API errors
class ApiException : public std::runtime_error {
public:
    enum class ErrorCode {
        UNKNOWN_ERROR = 0,
        INVALID_INPUT = 4000,
        UNAUTHORIZED = 4010,
        FORBIDDEN = 4030,
        NOT_FOUND = 4040,
        CONFLICT = 4090,
        INTERNAL_SERVER_ERROR = 5000,
        SERVICE_UNAVAILABLE = 5030,
        TOO_MANY_REQUESTS = 4290,
        BAD_CREDENTIALS = 4011
    };

    ApiException(ErrorCode code, const std::string& message)
        : std::runtime_error(message), error_code_(code) {}

    ErrorCode getErrorCode() const {
        return error_code_;
    }

    int getHttpStatus() const {
        switch (error_code_) {
            case ErrorCode::INVALID_INPUT: return 400;
            case ErrorCode::UNAUTHORIZED: return 401;
            case ErrorCode::BAD_CREDENTIALS: return 401;
            case ErrorCode::FORBIDDEN: return 403;
            case ErrorCode::NOT_FOUND: return 404;
            case ErrorCode::CONFLICT: return 409;
            case ErrorCode::TOO_MANY_REQUESTS: return 429;
            case ErrorCode::INTERNAL_SERVER_ERROR:
            case ErrorCode::UNKNOWN_ERROR:
            case ErrorCode::SERVICE_UNAVAILABLE:
            default: return 500;
        }
    }

protected:
    ErrorCode error_code_;
};

// Specific exceptions for better clarity
class BadRequestException : public ApiException {
public:
    BadRequestException(const std::string& message = "Invalid input provided.")
        : ApiException(ErrorCode::INVALID_INPUT, message) {}
};

class UnauthorizedException : public ApiException {
public:
    UnauthorizedException(const std::string& message = "Authentication required or invalid token.")
        : ApiException(ErrorCode::UNAUTHORIZED, message) {}
};

class ForbiddenException : public ApiException {
public:
    ForbiddenException(const std::string& message = "Access to this resource is forbidden.")
        : ApiException(ErrorCode::FORBIDDEN, message) {}
};

class NotFoundException : public ApiException {
public:
    NotFoundException(const std::string& message = "Resource not found.")
        : ApiException(ErrorCode::NOT_FOUND, message) {}
};

class ConflictException : public ApiException {
public:
    ConflictException(const std::string& message = "Resource already exists or conflicts with current state.")
        : ApiException(ErrorCode::CONFLICT, message) {}
};

class InternalServerErrorException : public ApiException {
public:
    InternalServerErrorException(const std::string& message = "An unexpected internal server error occurred.")
        : ApiException(ErrorCode::INTERNAL_SERVER_ERROR, message) {}
};

class TooManyRequestsException : public ApiException {
public:
    TooManyRequestsException(const std::string& message = "Too many requests. Please try again later.")
        : ApiException(ErrorCode::TOO_MANY_REQUESTS, message) {}
};

class BadCredentialsException : public UnauthorizedException {
public:
    BadCredentialsException(const std::string& message = "Invalid email or password.")
        : UnauthorizedException(message) { error_code_ = ErrorCode::BAD_CREDENTIALS; }
};

} // namespace CustomExceptions