```cpp
#ifndef HTTP_FETCHER_H
#define HTTP_FETCHER_H

#include <string>
#include <stdexcept>
#include <curl/curl.h>
#include <memory>
#include "../utils/Logger.h"

namespace Scraper {
namespace Scraping {

// Callback function for libcurl to write received data
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

class HttpFetcher {
public:
    HttpFetcher() {
        Scraper::Utils::Logger::get_logger()->debug("HttpFetcher initialized.");
    }

    // Fetches content from a URL
    std::string fetch(const std::string& url) {
        CURL* curl = curl_easy_init();
        if (!curl) {
            Scraper::Utils::Logger::get_logger()->error("Failed to initialize CURL.");
            throw std::runtime_error("Failed to initialize CURL.");
        }

        std::string buffer;
        CURLcode res;

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &buffer);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L); // Follow redirects
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L); // 10 seconds timeout
        curl_easy_setopt(curl, CURLOPT_USERAGENT, "ScraperBot/1.0 (C++)"); // Custom User-Agent

        Scraper::Utils::Logger::get_logger()->info("Fetching URL: {}", url);
        res = curl_easy_perform(curl);

        if (res != CURLE_OK) {
            Scraper::Utils::Logger::get_logger()->error("curl_easy_perform() failed for {}: {}", url, curl_easy_strerror(res));
            curl_easy_cleanup(curl);
            throw Scraper::Utils::ScrapingException("Failed to fetch URL: " + url + " - " + curl_easy_strerror(res));
        }

        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
        if (http_code >= 400) {
            Scraper::Utils::Logger::get_logger()->error("HTTP request for {} returned status code: {}", url, http_code);
            curl_easy_cleanup(curl);
            throw Scraper::Utils::ScrapingException("HTTP error fetching URL: " + url + " - Status " + std::to_string(http_code));
        }
        
        curl_easy_cleanup(curl);
        Scraper::Utils::Logger::get_logger()->info("Successfully fetched URL: {}", url);
        return buffer;
    }
};

} // namespace Scraping
} // namespace Scraper

#endif // HTTP_FETCHER_H
```