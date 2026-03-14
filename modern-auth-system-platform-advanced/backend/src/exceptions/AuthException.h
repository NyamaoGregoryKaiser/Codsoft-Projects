#ifndef AUTH_SYSTEM_AUTHEXCEPTION_H
#define AUTH_SYSTEM_AUTHEXCEPTION_H

#include <stdexcept>
#include <string>

enum class AuthErrorType {
    InvalidCredentials,
    UserNotFound,
    UserAlreadyExists,
    InvalidToken,
    TokenExpired,
    Unauthorized,
    Forbidden,
    InternalError,
    BadRequest
};

class AuthException : public std::runtime_error {
public:
    AuthException(AuthErrorType type, const std::string& message)
        : std::runtime_error(message), type_(type) {}

    AuthErrorType getType() const { return type_; }

    int getHttpStatusCode() const {
        switch (type_) {
            case AuthErrorType::InvalidCredentials:
            case AuthErrorType::InvalidToken:
                return 401; // Unauthorized
            case AuthErrorType::UserNotFound:
                return 404; // Not Found
            case AuthErrorType::UserAlreadyExists:
                return 409; // Conflict
            case AuthErrorType::TokenExpired:
                return 401; // Unauthorized (often requires refresh)
            case AuthErrorType::Unauthorized:
                return 401; // Unauthorized
            case AuthErrorType::Forbidden:
                return 403; // Forbidden
            case AuthErrorType::BadRequest:
                return 400; // Bad Request
            case AuthErrorType::InternalError:
            default:
                return 500; // Internal Server Error
        }
    }

private:
    AuthErrorType type_;
};

#endif // AUTH_SYSTEM_AUTHEXCEPTION_H