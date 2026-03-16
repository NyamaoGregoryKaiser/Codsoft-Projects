```cpp
#ifndef ERROR_HANDLER_H
#define ERROR_HANDLER_H

#include <pistache/http.h>
#include <pistache/router.h>

class ErrorHandler {
public:
    // Global error handler middleware
    static void handle(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    // Handler for 404 Not Found
    static void notFound(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    ErrorHandler() = delete; // Prevent instantiation
};

#endif // ERROR_HANDLER_H
```