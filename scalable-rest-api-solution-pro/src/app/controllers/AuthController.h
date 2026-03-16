```cpp
#ifndef AUTH_CONTROLLER_H
#define AUTH_CONTROLLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>

class AuthController {
public:
    static void registerUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void loginUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    AuthController() = delete; // Prevent instantiation
};

#endif // AUTH_CONTROLLER_H
```