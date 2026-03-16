```cpp
#ifndef APP_H
#define APP_H

#include <pistache/endpoint.h>
#include <pistache/router.h>
#include <memory> // For std::shared_ptr

class App {
public:
    App(const std::string& host, int port);
    void start();
    void shutdown();

private:
    std::shared_ptr<Pistache::Http::Endpoint> httpEndpoint;
    Pistache::Rest::Router router;

    void setupRoutes();
    void setupGlobalMiddleware();
};

#endif // APP_H
```