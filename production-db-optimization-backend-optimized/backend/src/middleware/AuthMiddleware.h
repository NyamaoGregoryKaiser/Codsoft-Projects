```cpp
#ifndef AUTH_MIDDLEWARE_H
#define AUTH_MIDDLEWARE_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <string>
#include <functional>
#include <jwt-cpp/jwt.h>

class AuthMiddleware {
public:
    // Wraps a handler with authentication logic
    Pistache::Rest::RouteCallback wrapHandler(Pistache::Rest::RouteCallback handler);

private:
    bool verifyToken(const std::string& token, long long& userId);
};

#endif // AUTH_MIDDLEWARE_H
```