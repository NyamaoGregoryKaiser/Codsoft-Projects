```cpp
#include "App.h"
#include "core/utils/Logger.h"
#include "core/utils/Config.h"
#include "app/middleware/AuthMiddleware.h"
#include "app/middleware/ErrorHandler.h"
#include "app/middleware/RateLimiter.h"
#include "app/controllers/AuthController.h"
#include "app/controllers/ProjectController.h"
#include "app/controllers/TaskController.h"

using namespace Pistache;
using namespace Pistache::Rest;

App::App(const std::string& host, int port) {
    Address addr(host, Port(port));
    httpEndpoint = std::make_shared<Http::Endpoint>(addr);
}

void App::start() {
    auto opts = Http::Endpoint::options()
        .threads(std::stoi(Config::get("server_threads", "4")))
        .flags(Http::Endpoint::options().ReuseAddr);
    httpEndpoint->init(opts);

    setupGlobalMiddleware();
    setupRoutes();

    httpEndpoint->set               Handler(router.handler());
    httpEndpoint->serve();
}

void App::shutdown() {
    httpEndpoint->shutdown();
}

void App::setupGlobalMiddleware() {
    // Error Handling Middleware (should be first to catch errors from other middleware/handlers)
    router.addMiddleware(Routes::MiddlewareFunction(ErrorHandler::handle));
    
    // Rate Limiting Middleware (before auth to protect auth endpoint too)
    router.addMiddleware(Routes::MiddlewareFunction(RateLimiter::limit));

    // Logger Middleware (optional, if you want to log every request)
    // router.addMiddleware(Routes::MiddlewareFunction([](const Http::Request& req, Http::ResponseWriter& writer) {
    //     Logger::info("Request: {} {}", req.method(), req.resource());
    // }));
}

void App::setupRoutes() {
    Routes::Post(router, "/api/auth/register", Routes::bind(&AuthController::registerUser));
    Routes::Post(router, "/api/auth/login", Routes::bind(&AuthController::loginUser));

    // Protected routes
    auto protected_routes = Routes::Group(router, "/api");
    protected_routes->addMiddleware(Routes::MiddlewareFunction(AuthMiddleware::authenticate));

    // Project routes
    protected_routes->get("/projects", Routes::bind(&ProjectController::getProjects));
    protected_routes->get("/projects/:id", Routes::bind(&ProjectController::getProjectById));
    protected_routes->post("/projects", Routes::bind(&ProjectController::createProject));
    protected_routes->put("/projects/:id", Routes::bind(&ProjectController::updateProject));
    protected_routes->del("/projects/:id", Routes::bind(&ProjectController::deleteProject));

    // Task routes (nested under project, or standalone)
    // For simplicity, let's keep tasks standalone for now, but linked by project_id
    protected_routes->get("/tasks", Routes::bind(&TaskController::getTasks));
    protected_routes->get("/tasks/:id", Routes::bind(&TaskController::getTaskById));
    protected_routes->post("/tasks", Routes::bind(&TaskController::createTask));
    protected_routes->put("/tasks/:id", Routes::bind(&TaskController::updateTask));
    protected_routes->del("/tasks/:id", Routes::bind(&TaskController::deleteTask));

    // Catch-all for undefined routes
    router.add(Http::Method::Get, "/:*", Routes::bind(&ErrorHandler::notFound));
    router.add(Http::Method::Post, "/:*", Routes::bind(&ErrorHandler::notFound));
    router.add(Http::Method::Put, "/:*", Routes::bind(&ErrorHandler::notFound));
    router.add(Http::Method::Delete, "/:*", Routes::bind(&ErrorHandler::notFound));

    Logger::info("API routes initialized.");
}
```