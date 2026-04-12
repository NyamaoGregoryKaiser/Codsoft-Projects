```cpp
#ifndef ERROR_HANDLER_H
#define ERROR_HANDLER_H

#include <stdexcept>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "Logger.h"

namespace Scraper {
namespace Utils {

// Base custom exception for the application
class ScraperException : public std::runtime_error {
public:
    explicit ScraperException(const std::string& message)
        : std::runtime_error(message) {
        Scraper::Utils::Logger::get_logger()->error("ScraperException: {}", message);
    }
    virtual ~ScraperException() noexcept = default;
};

// Specific exceptions
class NotFoundException : public ScraperException {
public:
    explicit NotFoundException(const std::string& message = "Resource not found")
        : ScraperException(message) {
        Scraper::Utils::Logger::get_logger()->warn("NotFoundException: {}", message);
    }
};

class UnauthorizedException : public ScraperException {
public:
    explicit UnauthorizedException(const std::string& message = "Unauthorized access")
        : ScraperException(message) {
        Scraper::Utils::Logger::get_logger()->warn("UnauthorizedException: {}", message);
    }
};

class BadRequestException : public ScraperException {
public:
    explicit BadRequestException(const std::string& message = "Bad request")
        : ScraperException(message) {
        Scraper::Utils::Logger::get_logger()->warn("BadRequestException: {}", message);
    }
    BadRequestException(const std::vector<std::string>& errors)
        : ScraperException("Bad request: " + (errors.empty() ? "" : errors[0])), errors_(errors) {
        for (const auto& err : errors) {
            Scraper::Utils::Logger::get_logger()->warn("BadRequestException: {}", err);
        }
    }

    const std::vector<std::string>& getErrors() const { return errors_; }

protected:
    std::vector<std::string> errors_;
};

class DatabaseException : public ScraperException {
public:
    explicit DatabaseException(const std::string& message = "Database error")
        : ScraperException(message) {
        Scraper::Utils::Logger::get_logger()->error("DatabaseException: {}", message);
    }
};

class ScrapingException : public ScraperException {
public:
    explicit ScrapingException(const std::string& message = "Scraping error")
        : ScraperException(message) {
        Scraper::Utils::Logger::get_logger()->error("ScrapingException: {}", message);
    }
};

// Utility to convert exceptions to JSON responses
nlohmann::json exceptionToJson(const ScraperException& ex, int status_code) {
    nlohmann::json error_json;
    error_json["status"] = "error";
    error_json["message"] = ex.what();
    if (auto badReqEx = dynamic_cast<const BadRequestException*>(&ex)) {
        error_json["errors"] = badReqEx->getErrors();
    }
    return error_json;
}

} // namespace Utils
} // namespace Scraper

#endif // ERROR_HANDLER_H
```