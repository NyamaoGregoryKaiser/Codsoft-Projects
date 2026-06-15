```cpp
#pragma once

#include <string>
#include <chrono>
#include <mutex>
#include <unordered_map>
#include <optional>
#include <Poco/JSON/Object.h>

namespace AppUtils {

// Simple in-memory cache for JSON objects with TTL
class Cache {
public:
    static Cache& getInstance();

    // Add an item to the cache
    void put(const std::string& key, const Poco::JSON::Object::Ptr& value, std::chrono::seconds ttl);

    // Get an item from the cache
    std::optional<Poco::JSON::Object::Ptr> get(const std::string& key);

    // Remove an item from the cache
    void remove(const std::string& key);

    // Clear all items from the cache
    void clear();

    // Set max size (for LRU or similar policies, currently just a soft limit)
    void setMaxSize(size_t size) {
        std::lock_guard<std::mutex> lock(mutex_);
        maxSize_ = size;
    }

private:
    Cache() : maxSize_(1000) {} // Default max size
    Cache(const Cache&) = delete;
    Cache& operator=(const Cache&) = delete;

    struct CacheEntry {
        Poco::JSON::Object::Ptr value;
        std::chrono::time_point<std::chrono::system_clock> expiryTime;
    };

    std::unordered_map<std::string, CacheEntry> cache_;
    std::mutex mutex_;
    size_t maxSize_;

    // Helper to clean up expired entries (optional, can be done periodically)
    void cleanupExpiredEntries();
};

} // namespace AppUtils
```