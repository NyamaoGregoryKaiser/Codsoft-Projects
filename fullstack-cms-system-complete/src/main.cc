```cpp
#include <drogon/drogon.h>
#include "utils/Logger.h"
#include <iostream>
#include <string>

int main()
{
    // Initialize custom logger
    ApexContent::Utils::Logger::init();

    // Set HTTP body maximum size to 10MB (example for media uploads)
    drogon::app().setMaxConnectionNumber(10000);
    drogon::app().setMaxIdleTime(60); // seconds
    drogon::app().setIdleConnectionTimeout(60); // seconds
    drogon::app().setUploadPath("./uploads"); // Path for file uploads
    drogon::app().setLogPath("./logs"); // Path for Drogon logs

    // Load configuration from config.json
    drogon::app().loadConfigFile("config/config.json");

    // Enable session (useful for traditional web pages, less for pure APIs)
    drogon::app().enableSession();

    // Add a simple static file handler for a hypothetical frontend build
    // In a real SPA setup, Nginx/Apache would serve the static files,
    // and this Drogon app would only serve the API.
    // For demonstration, we'll serve a basic HTML.
    drogon::app().enableStaticFilesServing();
    drogon::app().setDocumentRoot("src/views"); // Serve basic HTML files from here

    LOG_INFO << "ApexContent application starting...";

    // Run the application
    drogon::app().run();

    LOG_INFO << "ApexContent application stopped.";

    return 0;
}
```