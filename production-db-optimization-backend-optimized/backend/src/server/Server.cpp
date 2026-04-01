```cpp
#include "Server.h"
#include "utils/Logger.h"
#include "utils/AppConfig.h"
#include "common/Constants.h"

#include <functional>

Server::Server(Pistache::Address addr) {
    httpEndpoint = std::make_shared<Pistache::Http::Endpoint>(addr);
    auto opts = Pistache::Http::Endpoint::options()
        .threads(AppConfig::get<int>("SERVER_THREADS", 4))
        .flags(Pistache::Http::Endpoint::options::ReuseAddr);
    httpEndpoint->init(opts);
    LOG_INFO("Server initialized on address: {}", addr.host());
}

void Server::setupRoutes() {
    // --- Middleware Application ---
    // Error handling should be the outermost to catch all exceptions
    router.addMiddleware(Pistache::Rest::Router::Middleware::make(
        [this](const auto& request, auto handler) {
            return errorMiddleware.handle(request, handler);
        }
    ));
    // Logging middleware
    router.addMiddleware(Pistache::Rest::Router::Middleware::make(
        [this](const auto& request, auto handler) {
            return loggingMiddleware.handle(request, handler);
        }
    ));
    // Rate Limiting middleware
    router.addMiddleware(Pistache::Rest::Router::Middleware::make(
        [this](const auto& request, auto handler) {
            return rateLimitMiddleware.handle(request, handler);
        }
    ));

    // --- Authentication Routes ---
    Pistache::Rest::Routes::Post(router, Constants::API_BASE_PATH + "/auth/register",
        Pistache::Rest::Routes::bind(&AuthController::registerUser, &authController));
    Pistache::Rest::Routes::Post(router, Constants::API_BASE_PATH + "/auth/login",
        Pistache::Rest::Routes::bind(&AuthController::loginUser, &authController));

    // --- Protected Routes (apply AuthMiddleware) ---
    // The AuthMiddleware will be applied directly to individual handlers or groups
    // For simplicity, we'll apply it per route. In a larger system, consider route groups.
    auto secureRoute = [&](const auto& handler) {
        return authMiddleware.wrapHandler(handler);
    };

    // Product Routes
    Pistache::Rest::Routes::Post(router, Constants::API_BASE_PATH + "/products",
        secureRoute(Pistache::Rest::Routes::bind(&ProductController::createProduct, &productController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/products",
        secureRoute(Pistache::Rest::Routes::bind(&ProductController::getProducts, &productController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/products/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ProductController::getProductById, &productController)));
    Pistache::Rest::Routes::Put(router, Constants::API_BASE_PATH + "/products/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ProductController::updateProduct, &productController)));
    Pistache::Rest::Routes::Delete(router, Constants::API_BASE_PATH + "/products/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ProductController::deleteProduct, &productController)));

    // Category Routes
    Pistache::Rest::Routes::Post(router, Constants::API_BASE_PATH + "/categories",
        secureRoute(Pistache::Rest::Routes::bind(&CategoryController::createCategory, &categoryController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/categories",
        secureRoute(Pistache::Rest::Routes::bind(&CategoryController::getCategories, &categoryController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/categories/:id",
        secureRoute(Pistache::Rest::Routes::bind(&CategoryController::getCategoryById, &categoryController)));
    Pistache::Rest::Routes::Put(router, Constants::API_BASE_PATH + "/categories/:id",
        secureRoute(Pistache::Rest::Routes::bind(&CategoryController::updateCategory, &categoryController)));
    Pistache::Rest::Routes::Delete(router, Constants::API_BASE_PATH + "/categories/:id",
        secureRoute(Pistache::Rest::Routes::bind(&CategoryController::deleteCategory, &categoryController)));

    // Manufacturer Routes
    Pistache::Rest::Routes::Post(router, Constants::API_BASE_PATH + "/manufacturers",
        secureRoute(Pistache::Rest::Routes::bind(&ManufacturerController::createManufacturer, &manufacturerController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/manufacturers",
        secureRoute(Pistache::Rest::Routes::bind(&ManufacturerController::getManufacturers, &manufacturerController)));
    Pistache::Rest::Routes::Get(router, Constants::API_BASE_PATH + "/manufacturers/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ManufacturerController::getManufacturerById, &manufacturerController)));
    Pistache::Rest::Routes::Put(router, Constants::API_BASE_PATH + "/manufacturers/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ManufacturerController::updateManufacturer, &manufacturerController)));
    Pistache::Rest::Routes::Delete(router, Constants::API_BASE_PATH + "/manufacturers/:id",
        secureRoute(Pistache::Rest::Routes::bind(&ManufacturerController::deleteManufacturer, &manufacturerController)));

    // Fallback route for 404
    router.addMiddleware(Pistache::Rest::Router::Middleware::make(
        [](const Pistache::Http::Request&, Pistache::Http::ResponseWriter response) {
            response.send(Pistache::Http::Code::Not_Found, "{\"error\": \"Not Found\"}");
            return Pistache::Rest::Router::Result::Ok;
        }
    ));

    LOG_INFO("API routes configured.");
}

void Server::start() {
    setupRoutes();
    httpEndpoint->set               Handler(router.handler());
    httpEndpoint->serve(); // This call is blocking
    LOG_INFO("Server stopped.");
}
```