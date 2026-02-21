```cpp
#include <drogon/drogon.h>
#include <spdlog/spdlog.h>
#include <spdlog/sinks/daily_file_sink.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <iostream>
#include <string>

// Include all controllers and middleware
#include "controllers/ProductController.h"
#include "controllers/UserController.h"
#include "controllers/OrderController.h"
#include "middleware/AuthMiddleware.h"
#include "middleware/LoggingMiddleware.h"
#include "middleware/RateLimitMiddleware.h"
#include "exceptions/ApiException.h"

// Forward declare configuration loading function
void load_app_config();
void setup_logger();

int main()
{
    // Setup logger first
    setup_logger();
    spdlog::info("Application starting up...");

    // Load configuration
    load_app_config();

    // Register controllers
    drogon::app().registerHandler("/api/v1/products", &ProductController::getProducts, {drogon::Get}, "ProductController::getProducts");
    drogon::app().registerHandler("/api/v1/products/{id}", &ProductController::getProductById, {drogon::Get}, "ProductController::getProductById");
    drogon::app().registerHandler("/api/v1/products", &ProductController::createProduct, {drogon::Post}, "ProductController::createProduct");
    drogon::app().registerHandler("/api/v1/products/{id}", &ProductController::updateProduct, {drogon::Put}, "ProductController::updateProduct");
    drogon::app().registerHandler("/api/v1/products/{id}", &ProductController::deleteProduct, {drogon::Delete}, "ProductController::deleteProduct");

    drogon::app().registerHandler("/api/v1/auth/register", &UserController::registerUser, {drogon::Post}, "UserController::registerUser");
    drogon::app().registerHandler("/api/v1/auth/login", &UserController::loginUser, {drogon::Post}, "UserController::loginUser");
    drogon::app().registerHandler("/api/v1/users/profile", &UserController::getUserProfile, {drogon::Get}, "UserController::getUserProfile"); // Requires AuthMiddleware
    drogon::app().registerHandler("/api/v1/users/profile", &UserController::updateUserProfile, {drogon::Put}, "UserController::updateUserProfile"); // Requires AuthMiddleware

    drogon::app().registerHandler("/api/v1/orders", &OrderController::createOrder, {drogon::Post}, "OrderController::createOrder"); // Requires AuthMiddleware
    drogon::app().registerHandler("/api/v1/orders/{id}", &OrderController::getOrderById, {drogon::Get}, "OrderController::getOrderById"); // Requires AuthMiddleware
    drogon::app().registerHandler("/api/v1/orders/user", &OrderController::getUserOrders, {drogon::Get}, "OrderController::getUserOrders"); // Requires AuthMiddleware
    // ... more order endpoints ...

    // Apply global middlewares
    drogon::app().registerPreRoutingAdvice<LoggingMiddleware>();
    drogon::app().registerPreRoutingAdvice<RateLimitMiddleware>();

    // Apply AuthMiddleware to specific routes or groups of routes
    // Drogon allows applying middleware to controllers directly or using custom filter registration.
    // For simplicity, we assume routes like /api/v1/users/profile or /api/v1/orders implicitly use it.
    // A more robust way is to define specific filters and apply them.
    // Example: Create a filter class `AuthFilter` inherited from `drogon::HttpFilter`
    // and then apply it like:
    // drogon::app().registerHandler("/api/v1/users/profile", &UserController::getUserProfile, {drogon::Get}, "AuthFilter");


    // Global error handling: Drogon's default 404/500 handlers or custom exception handlers
    // You can customize default error pages or use exception handling middleware.
    drogon::app().setCustom404Page([](const drogon::HttpRequestPtr& req, std::function<void (const drogon::HttpResponsePtr &)> &&callback) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Not Found"));
        resp->setStatusCode(drogon::k404NotFound);
        callback(resp);
    });

    // Custom exception handling for ApiException
    drogon::app().setExceptionHandler([](const drogon::HttpRequestPtr& req, const std::exception& e, std::function<void (const drogon::HttpResponsePtr &)> &&callback) {
        if (const ApiException* apiEx = dynamic_cast<const ApiException*>(&e)) {
            Json::Value json;
            json["error"] = apiEx->what();
            json["statusCode"] = apiEx->getStatusCode();
            auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
            resp->setStatusCode(static_cast<drogon::HttpStatusCode>(apiEx->getStatusCode()));
            spdlog::error("API Exception caught: {}. Status: {}", apiEx->what(), apiEx->getStatusCode());
            callback(resp);
        } else {
            // Default handler for other exceptions
            Json::Value json;
            json["error"] = "Internal Server Error";
            json["details"] = e.what();
            auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
            resp->setStatusCode(drogon::k500InternalServerError);
            spdlog::error("Unhandled exception caught: {}", e.what());
            callback(resp);
        }
    });

    spdlog::info("Drogon application starting on port {}.", drogon::app().get  <int>("http_port"));
    drogon::app().run();

    spdlog::info("Application shutting down.");
    return 0;
}

void setup_logger() {
    auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
    console_sink->set_level(spdlog::level::debug);
    console_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v");

    auto file_sink = std::make_shared<spdlog::sinks::daily_file_sink_mt>("logs/ecommerce.log", 0, 0);
    file_sink->set_level(spdlog::level::info);
    file_sink->set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] [thread %t] %v");

    spdlog::sinks_init_list sink_list = {console_sink, file_sink};
    auto logger = std::make_shared<spdlog::logger>("ecommerce_logger", sink_list.begin(), sink_list.end());
    logger->set_level(spdlog::level::debug);
    spdlog::set_default_logger(logger);
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [thread %t] %v"); // Default pattern for global spdlog calls
}

void load_app_config() {
    try {
        drogon::app().loadConfigFile("config/app.json");
        // Access config values, e.g., for JWT secret or Redis connection
        // std::string jwt_secret = drogon::app().get<std::string>("jwt_secret");
        // spdlog::info("JWT Secret loaded.");
    } catch (const std::exception& e) {
        spdlog::error("Failed to load application configuration: {}", e.what());
        exit(EXIT_FAILURE); // Critical failure
    }
}
```