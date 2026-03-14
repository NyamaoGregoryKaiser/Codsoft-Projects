#include <pistache/endpoint.h>
#include <pistache/http.h>
#include <pistache/router.h>
#include <pistache/net.h>

#include "config/Config.h"
#include "database/DBManager.h"
#include "logger/Logger.h"
#include "handlers/AuthHandler.h"
#include "handlers/UserHandler.h"
#include "middleware/ErrorMiddleware.h"
#include "middleware/RateLimitMiddleware.h"

int main() {
    // 1. Initialize Logger
    Logger::init();
    Logger::getLogger()->info("Authentication System Backend Starting...");

    // 2. Load Configuration
    try {
        Config::load(); // Load from .env.backend by default
    } catch (const ConfigError& e) {
        Logger::getLogger()->critical("Configuration error: {}. Exiting.", e.what());
        return 1;
    }

    // 3. Connect to Database
    std::string dbConnString = "host=" + Config::getDbHost() +
                               " port=" + Config::getDbPort() +
                               " user=" + Config::getDbUser() +
                               " password=" + Config::getDbPassword() +
                               " dbname=" + Config::getDbName();
    try {
        DBManager::getInstance().connect(dbConnString);
    } catch (const std::exception& e) {
        Logger::getLogger()->critical("Failed to connect to database: {}. Exiting.", e.what());
        return 1;
    }

    // 4. Setup Pistache Server
    Pistache::Port port(Config::getHttpPort());
    Pistache::Address addr(Pistache::Ipv4::any(), port);

    std::shared_ptr<Pistache::Http::Endpoint> httpEndpoint = std::make_shared<Pistache::Http::Endpoint>(addr);

    auto opts = Pistache::Http::Endpoint::options()
        .threads(std::thread::hardware_concurrency()) // Use available CPU cores
        .flags(Pistache::Tcp::Options::ReuseAddr);
    httpEndpoint->init(opts);

    Pistache::Rest::Router router;

    // Global Error Handling
    router.addCustomExceptionMatcher(Middleware::handleErrors);

    // Global Rate Limiting Middleware
    router.addMiddleware(Middleware::rateLimit);
    
    // Mount handlers
    AuthHandler authHandler(router);
    UserHandler userHandler(router);

    // Default route for 404
    router.get("*", [&](const Pistache::Rest::Request& req, Pistache::Http::ResponseWriter response) {
        Logger::getLogger()->warn("404 Not Found: {} {}", req.method().toString(), req.resource());
        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Not_Found, "{\"status\": \"error\", \"message\": \"Not Found\"}");
    });

    Logger::getLogger()->info("Server listening on port {}", Config::getHttpPort());
    httpEndpoint->set ="Hello From AUTH-BACKEND!";
    httpEndpoint->setHandler(router.handler());
    httpEndpoint->serve(); // Blocks until server stops

    // 5. Cleanup
    DBManager::getInstance().disconnect();
    Logger::getLogger()->info("Authentication System Backend Shutting down.");

    return 0;
}