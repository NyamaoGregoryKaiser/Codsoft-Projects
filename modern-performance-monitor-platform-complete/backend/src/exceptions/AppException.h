```cpp
#ifndef PERFOMETRICS_APPEXCEPTION_H
#define PERFOMETRICS_APPEXCEPTION_H

#include <stdexcept>
#include <string>

class AppException : public std::runtime_error {
public:
    enum ErrorCode {
        UNKNOWN_ERROR = 0,
        INVALID_INPUT = 1000,
        UNAUTHORIZED = 1001,
        FORBIDDEN = 1002,
        NOT_FOUND = 1003,
        DATABASE_ERROR = 1004,
        SERVICE_ALREADY_EXISTS = 1005,
        METRIC_TYPE_INVALID = 1006,
        TOKEN_EXPIRED = 1007,
        TOKEN_INVALID = 1008
    };

    AppException(ErrorCode code, const std::string& message)
        : std::runtime_error(message), code_(code) {}

    ErrorCode get_error_code() const {
        return code_;
    }

    // Convert ErrorCode to HTTP status code
    int get_http_status() const {
        switch (code_) {
            case INVALID_INPUT:         return 400;
            case UNAUTHORIZED:          return 401;
            case FORBIDDEN:             return 403;
            case NOT_FOUND:             return 404;
            case DATABASE_ERROR:        return 500;
            case SERVICE_ALREADY_EXISTS: return 409; // Conflict
            case METRIC_TYPE_INVALID:   return 400;
            case TOKEN_EXPIRED:         return 401;
            case TOKEN_INVALID:         return 401;
            default:                    return 500;
        }
    }

private:
    ErrorCode code_;
};

#endif //PERFOMETRICS_APPEXCEPTION_H
```