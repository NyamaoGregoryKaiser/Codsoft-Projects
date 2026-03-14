#ifndef AUTH_SYSTEM_AUTHHANDLER_H
#define AUTH_SYSTEM_AUTHHANDLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../database/DBManager.h"
#include "../utils/PasswordHasher.h"
#include "../utils/JWTManager.h"
#include "../exceptions/AuthException.h"
#include "../logger/Logger.h"

class AuthHandler {
public:
    explicit AuthHandler(Pistache::Rest::Router& router);

    void registerUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void loginUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void refreshToken(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void logoutUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
};

#endif // AUTH_SYSTEM_AUTHHANDLER_H