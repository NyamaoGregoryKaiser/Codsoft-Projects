#pragma once

#include <stdexcept>
#include <string>
#include "crow.h" // For crow::HTTPResponseCode

// Custom exceptions for clearer error handling
class BadRequestError : public std::runtime_error {
public:
    explicit BadRequestError(const std::string& message) : std::runtime_error(message) {}
};

class NotFoundError : public std::runtime_error {
public:
    explicit NotFoundError(const std::string& message) : std::runtime_error(message) {}
};

class UnauthorizedError : public std::runtime_error {
public:
    explicit UnauthorizedError(const std::string& message) : std::runtime_error(message) {}
};

class ForbiddenError : public std::runtime_error {
public:
    explicit ForbiddenError(const std::string& message) : std::runtime_error(message) {}
};

class InternalServerError : public std::runtime_error {
public:
    explicit InternalServerError(const std::string& message) : std::runtime_error(message) {}
};

// Function to handle exceptions and send appropriate HTTP responses
void handle_exception(crow::response& res, const std::exception& e);
```