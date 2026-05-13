```cpp
#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <drogon/plugins/JsonConfig.h>

#include "src/utils/AppConfig.h"
#include "src/utils/Logger.h"
#include "src/utils/JWTUtils.h"
#include "src/utils/Cache.h"
#include "src/utils/RateLimiter.h"

#include "src/dao/UserDAO.h"
#include "src/dao/ProductDAO.h"
#include "src/dao/OrderDAO.h"

#include "src/services/AuthService.h"
#include "src/services/UserService.h"
#include "src/services/ProductService.h"
#include "src/services/OrderService.h"

#include "src/controllers/BaseController.h" // For health check
#include "src/controllers/AuthController.h"
#include "src/controllers/UserController.h"
#include "src/controllers/ProductController.h"
#include "src/controllers/OrderController.h"

int main()
{
    try
    {
        // 1. Initialize application configuration
        utils::AppConfig &appConfig = utils::AppConfig::getInstance();
        (void)appConfig; // Ensure it's initialized

        // 2. Initialize Logger (uses AppConfig)
        utils::Logger::getInstance();
        LOG_INFO("Application starting...");

        // 3. Initialize JWT utility (uses AppConfig)
        std::string jwtSecret = appConfig.getString("jwt.secret");
        if (jwtSecret.length() < 32) {
            LOG_CRITICAL("JWT secret is too short (min 32 chars recommended). Please update .env or config/default.json.");
            return 1;
        }
        utils::JWTUtils::initialize(jwtSecret);

        // 4. Initialize Cache (uses AppConfig)
        utils::Cache::getInstance();

        // 5. Initialize Rate Limiter (uses AppConfig)
        utils::RateLimiter::getInstance();

        // 6. Set up Drogon HTTP app framework
        drogon::app().addListener("0.0.0.0", appConfig.getInt("app.port"));
        drogon::app().setLogPath("./logs");
        drogon::app().setLogLevel(utils::Logger::getInstance().getLogger()->level());
        drogon::app().enableSession(600); // Enable session for 600 seconds (10 minutes) if needed for web.
                                          // For API-only, JWT is stateless, so this is less critical.
        drogon::app().setThreadNum(std::thread::hardware_concurrency() * 2); // Optimal for CPU-bound tasks

        // 7. Register DAOs
        auto userDAO = std::make_shared<dao::UserDAO>();
        auto productDAO = std::make_shared<dao::ProductDAO>();
        auto orderDAO = std::make_shared<dao::OrderDAO>();

        // 8. Register Services
        auto authService = std::make_shared<services::AuthService>(userDAO);
        auto userService = std::make_shared<services::UserService>(userDAO);
        auto productService = std::make_shared<services::ProductService>(productDAO);
        auto orderService = std::make_shared<services::OrderService>(orderDAO, productDAO);

        // 9. Register Controllers (Drogon automatically registers them if they inherit HttpController)
        // We manually create instances to inject dependencies
        drogon::app().registerHttpController(std::make_shared<controllers::AuthController>(authService));
        drogon::app().registerHttpController(std::make_shared<controllers::UserController>(userService));
        drogon::app().registerHttpController(std::make_shared<controllers::ProductController>(productService));
        drogon::app().registerHttpController(std::make_shared<controllers::OrderController>(orderService));
        drogon::app().registerHttpController(std::make_shared<controllers::BaseController>()); // For health check

        // 10. Run the application
        LOG_INFO("Application started on port {}", appConfig.getInt("app.port"));
        drogon::app().run();
    }
    catch (const std::exception &e)
    {
        std::cerr << "Application critical error: " << e.what() << std::endl;
        LOG_CRITICAL("Application terminated due to critical error: {}", e.what());
        return 1;
    }
    catch (...)
    {
        std::cerr << "Application unknown critical error." << std::endl;
        LOG_CRITICAL("Application terminated due to unknown critical error.");
        return 1;
    }

    LOG_INFO("Application stopped.");
    return 0;
}
```