```cpp
#ifndef SERVER_H
#define SERVER_H

#include <pistache/endpoint.h>
#include <pistache/router.h>

#include "middleware/LoggingMiddleware.h"
#include "middleware/ErrorMiddleware.h"
#include "middleware/AuthMiddleware.h"
#include "middleware/RateLimitMiddleware.h"

// Controllers
#include "controllers/AuthController.h"
#include "controllers/ProductController.h"
#include "controllers/CategoryController.h"
#include "controllers/ManufacturerController.h"

class Server {
public:
    explicit Server(Pistache::Address addr = Pistache::Address("*:9080"));
    void start();

private:
    std::shared_ptr<Pistache::Http::Endpoint> httpEndpoint;
    Pistache::Rest::Router router;

    // Middleware instances
    LoggingMiddleware loggingMiddleware;
    ErrorMiddleware errorMiddleware;
    AuthMiddleware authMiddleware;
    RateLimitMiddleware rateLimitMiddleware;

    // Controller instances
    AuthController authController;
    ProductController productController;
    CategoryController categoryController;
    ManufacturerController manufacturerController;

    void setupRoutes();
    void addMiddleware(Pistache::Rest::Router& router);
};

#endif // SERVER_H
```