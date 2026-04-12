```cpp
#include "app.h"
#include <iostream>
#include <csignal>

// Global pointer to the application instance for signal handler
std::unique_ptr<Scraper::App> global_app_instance;

// Signal handler function
void signalHandler(int signal) {
    if (global_app_instance) {
        global_app_instance->handleSignal(signal);
    } else {
        std::cerr << "Error: Application instance not available for signal handling." << std::endl;
        exit(1);
    }
}

int main() {
    // Register signal handlers for graceful shutdown
    std::signal(SIGINT, signalHandler);  // Ctrl+C
    std::signal(SIGTERM, signalHandler); // kill command

    global_app_instance = std::make_unique<Scraper::App>();

    try {
        global_app_instance->init();
        global_app_instance->run();
    } catch (const std::exception& e) {
        // Logging is initialized, so use it.
        Scraper::Utils::Logger::get_logger()->critical("Application critical error: {}", e.what());
        std::cerr << "Application terminated due to critical error: " << e.what() << std::endl;
        global_app_instance->shutdown();
        return 1;
    }

    // Ensure app is properly shutdown even if run() finishes prematurely
    global_app_instance->shutdown();
    Scraper::Utils::Logger::get_logger()->info("Application main thread exiting gracefully.");

    return 0;
}
```