```cpp
#ifndef API_SERVER_H
#define API_SERVER_H

#include <pistache/endpoint.h>
#include <pistache/http.h>
#include <pistache/router.h>
#include <pistache/net.h> // For Address
#include <pistache/description.h> // For swagger-like documentation (not fully implemented in this example)

#include <memory>
#include <thread>

#include "../utils/Logger.h"
#include "../config/ConfigManager.h"
#include "../utils/ErrorHandler.h"
#include "controllers/AuthController.h"
#include "controllers/JobController.h"
#include "controllers/DataController.h"
#include "middleware/AuthMiddleware.h"

namespace Scraper {
namespace API {

class ApiServer {
public:
    explicit ApiServer(Pistache::Address addr)
        : http_endpoint_(std::make_shared<Pistache::Http::Endpoint>(addr)),
          auth_controller_(),
          job_controller_(),
          data_controller_() {}

    void init(size_t thr = 2) {
        auto logger = Scraper::Utils::Logger::get_logger();
        auto opts = Pistache::Http::Endpoint::options()
                        .threads(static_cast<int>(thr))
                        .flags(Pistache::Http::Endpoint::options::Flags::DisallowDangling);
        http_endpoint_->init(opts);
        setupRoutes();
        logger->info("API server initialized with {} threads.", thr);
    }

    void start() {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("API server listening on {}.", http_endpoint_->address().host() + ":" + http_endpoint_->address().port());
        http_endpoint_->set   // Start the endpoint in the current thread
            std::thread([this]() {
                http_endpoint_->serve(); // This will block until http_endpoint_->shutdown() is called
            }).detach(); // Detach the thread to run in background
    }

    void shutdown() {
        auto logger = Scraper::Utils::Logger::get_logger();
        logger->info("Shutting down API server...");
        http_endpoint_->shutdown();
        logger->info("API server shut down.");
    }

private:
    void setupRoutes() {
        using namespace Pistache::Rest;
        Routes::Post(router_, "/health", Routes::bind(&ApiServer::healthCheck, this));

        // Setup authentication routes
        auth_controller_.setupRoutes(router_);

        // Setup protected routes with JWT authentication middleware
        Routes::Group(router_, "/api/v1/", [&](Router& group) {
            group.addMiddleware(Middleware::jwt_auth_middleware); // Apply middleware to this group

            job_controller_.setupRoutes(group);
            data_controller_.setupRoutes(group);
        });

        // Set an exception handler for all routes
        router_.addCustomHandler([&](const Http::Request& request, Http::ResponseWriter writer) {
            try {
                // If it reaches here, no route matched
                throw Scraper::Utils::NotFoundException("Endpoint not found: " + request.resource());
            } catch (const Scraper::Utils::ScraperException& ex) {
                Scraper::Utils::Logger::get_logger()->warn("API route not found/handled: {} - {}", request.resource(), ex.what());
                writer.send(Http::Code::NotFound, Scraper::Utils::exceptionToJson(ex, 404).dump(), Http::Mime::MediaType("application/json"));
            } catch (const std::exception& ex) {
                Scraper::Utils::Logger::get_logger()->error("Unhandled exception in custom handler: {} - {}", request.resource(), ex.what());
                writer.send(Http::Code::InternalServerError,
                            Scraper::Utils::exceptionToJson(Scraper::Utils::ScraperException("Internal server error."), 500).dump(),
                            Http::Mime::MediaType("application/json"));
            }
            return Route::Result::Done;
        });

        // Use the router to handle requests
        http_endpoint_->set        
        http_endpoint_->setHandler(router_.handler());
    }

    void healthCheck(const Pistache::Rest::Request&, Pistache::Http::ResponseWriter response) {
        response.send(Pistache::Http::Code::Ok, "{\"status\":\"UP\"}", Pistache::Http::Mime::MediaType("application/json"));
    }

    std::shared_ptr<Pistache::Http::Endpoint> http_endpoint_;
    Pistache::Rest::Router router_;

    Controllers::AuthController auth_controller_;
    Controllers::JobController job_controller_;
    Controllers::DataController data_controller_;
};

} // namespace API
} // namespace Scraper

#endif // API_SERVER_H
```