```cpp
#ifndef OPTIDB_EXCEPTIONS_H
#define OPTIDB_EXCEPTIONS_H

#include <stdexcept>
#include <string>

// Base custom exception for the application
class OptiDBException : public std::runtime_error {
public:
    explicit OptiDBException(const std::string& message) : std::runtime_error(message) {}
};

// HTTP-related exceptions
class BadRequestException : public OptiDBException {
public:
    explicit BadRequestException(const std::string& message) : OptiDBException(message) {}
};

class UnauthorizedException : public OptiDBException {
public:
    explicit UnauthorizedException(const std::string& message) : OptiDBException(message) {}
};

class ForbiddenException : public OptiDBException {
public:
    explicit ForbiddenException(const std::string& message) : OptiDBException(message) {}
};

class NotFoundException : public OptiDBException {
public:
    explicit NotFoundException(const std::string& message) : OptiDBException(message) {}
};

class ConflictException : public OptiDBException {
public:
    explicit ConflictException(const std::string& message) : OptiDBException(message) {}
};

// Database-related exceptions
class DatabaseException : public OptiDBException {
public:
    explicit DatabaseException(const std::string& message) : OptiDBException(message) {}
};

class DatabaseConnectionException : public DatabaseException {
public:
    explicit DatabaseConnectionException(const std::string& message) : DatabaseException(message) {}
};

// Other specific exceptions
class ValidationException : public OptiDBException {
public:
    explicit ValidationException(const std::string& message) : OptiDBException(message) {}
};

#endif // OPTIDB_EXCEPTIONS_H
```