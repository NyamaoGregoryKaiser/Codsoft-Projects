```cpp
#ifndef PERFOMETRICS_SERVER_H
#define PERFOMETRICS_SERVER_H

#include "crow.h"
#include "../services/MetricService.h"
#include "../services/AuthService.h"
#include "../middleware/AuthMiddleware.h"
#include "../middleware/RateLimitMiddleware.h"
#include "../utils/Logger.h"
#include "../utils/Config.h"
#include <string>

namespace PerfoMetrics {

class Server {
public:
    Server(int port);
    void run();

private:
    crow::App<PerfoMetrics::AuthMiddleware, PerfoMetrics::RateLimitMiddleware> app;
    MetricService metric_service;
    AuthService auth_service;
    int port;

    void setup_routes();
    void handle_exception(crow::response& res, const AppException& e);
    void handle_exception(crow::response& res, const std::exception& e);
};

} // namespace PerfoMetrics

#endif //PERFOMETRICS_SERVER_H
```