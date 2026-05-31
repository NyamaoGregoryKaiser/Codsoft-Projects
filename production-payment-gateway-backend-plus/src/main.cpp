```cpp
#include <httplib.h>
#include "config/config.hpp"
#include "utils/logger.hpp"
#include "api/routes.hpp"
#include <iostream>
#include <stdexcept>
#include <signal.h> // For signal handling

httplib::Server svr; // Global server instance

void signalHandler(int signum) {
    LOG_INFO("Interrupt signal ({0}) received. Shutting down server...", signum);
    svr.stop();
    exit(signum);
}

int main() {
    // Register signal handler for graceful shutdown
    signal(SIGINT, signalHandler);  // Ctrl+C
    signal(SIGTERM, signalHandler); // kill command

    // Initialize configuration
    const auto& config = Zenith::Config::AppConfig::getInstance();
    Zenith::Utils::Logger::getLogger(); // Initialize logger with config

    LOG_INFO("Zenith Payments API Server starting...");
    LOG_INFO("Server Host: {0}, Port: {1}", config.getServerHost(), config.getServerPort());
    LOG_INFO("DB Host: {0}, DB Name: {1}", config.getDbHost(), config.getDbName());

    // --- Configure HTTP Server ---
    svr.set_post_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        LOG_INFO("{0} {1} {2} {3}", req.method, req.path, res.status, req.remote_addr);
        if (res.status >= 400 && res.get_header_value("Content-Type").find("application/json") == std::string::npos) {
             // Fallback for non-JSON errors
            nlohmann::json error_json;
            error_json["message"] = "An unexpected error occurred.";
            if (res.status == 404) error_json["message"] = "Resource not found.";
            res.set_content(error_json.dump(), "application/json");
        }
    });

    // Setup API routes
    Zenith::Api::setupRoutes(svr);

    // Start the server
    try {
        if (!svr.listen(config.getServerHost().c_str(), config.getServerPort())) {
            LOG_CRITICAL("Failed to start HTTP server on {0}:{1}", config.getServerHost(), config.getServerPort());
            return 1;
        }
    } catch (const std::exception& e) {
        LOG_CRITICAL("An unhandled exception occurred: {0}", e.what());
        return 1;
    }

    LOG_INFO("Zenith Payments API Server stopped.");
    return 0;
}
```