```cpp
#ifndef AUTH_MIDDLEWARE_H
#define AUTH_MIDDLEWARE_H

#include <pistache/http.h>
#include <pistache/router.h>

class AuthMiddleware {
public:
    static void authenticate(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    AuthMiddleware() = delete; // Prevent instantiation
};

#endif // AUTH_MIDDLEWARE_H
```