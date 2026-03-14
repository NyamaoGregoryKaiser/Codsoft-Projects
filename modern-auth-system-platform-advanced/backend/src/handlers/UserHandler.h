#ifndef AUTH_SYSTEM_USERHANDLER_H
#define AUTH_SYSTEM_USERHANDLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../database/DBManager.h"
#include "../exceptions/AuthException.h"
#include "../logger/Logger.h"
#include "../middleware/AuthMiddleware.h"
#include "../utils/PasswordHasher.h"

class UserHandler {
public:
    explicit UserHandler(Pistache::Rest::Router& router);

    void getUserProfile(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void updateUserProfile(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    
    // Admin operations
    void getAllUsers(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void getUserById(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    void createUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response); // Admin creates users
    void updateUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response); // Admin updates any user
    void deleteUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response); // Admin deletes users
};

#endif // AUTH_SYSTEM_USERHANDLER_H