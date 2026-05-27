#ifndef ML_UTILITIES_SYSTEM_CACHE_MANAGER_HPP
#define ML_UTILITIES_SYSTEM_CACHE_MANAGER_HPP

#include <string>
#include <map>
#include <chrono>
#include <mutex>
#include <optional>
#include "../utils/logger.hpp"
#include "nlohmann/json.hpp" // Assuming cached items are JSON strings

/**
 * @brief Represents a cached item with its value and expiration timestamp.
 */
struct CachedItem {
    std::string value;
    std::chrono::system_clock::time_point expires_at;
};

/**
 * @brief Simple in-memory cache manager with a time-to-live (TTL) mechanism.
 *
 * This class provides static methods to store and retrieve data from an
 * in-memory cache, ensuring items expire after a configurable TTL.
 * It's thread-safe for basic operations.
 *
 * For a real production system, consider a distributed cache like Redis.
 */
class CacheManager {
private:
    static std::map<std::string, CachedItem> cache;
    static std::mutex cache_mutex;
    static int default_ttl_seconds; // Time-to-live for cache entries in seconds
    static bool initialized;

    CacheManager() = delete; // Prevent instantiation

public:
    /**
     * @brief Initializes the CacheManager with a default TTL.
     * @param ttl_seconds The default time-to-live for cache entries in seconds.
     */
    static void init(int ttl_seconds) {
        if (initialized) {
            LOG_WARN("CacheManager already initialized. Skipping re-initialization.");
            return;
        }
        if (ttl_seconds <= 0) {
            LOG_WARN("Cache TTL must be positive. Setting to 300 seconds (5 minutes).");
            default_ttl_seconds = 300;
        } else {
            default_ttl_seconds = ttl_seconds;
        }
        initialized = true;
        LOG_INFO("CacheManager initialized with default TTL: {} seconds.", default_ttl_seconds);
    }

    /**
     * @brief Stores an item in the cache.
     * @param key The key to store the item under.
     * @param value The string value to cache.
     * @param ttl_seconds Optional custom TTL for this item. If 0, uses default_ttl_seconds.
     */
    static void set(const std::string& key, const std::string& value, int ttl_seconds = 0) {
        if (!initialized) {
            LOG_WARN("CacheManager not initialized. Cannot set item for key: {}", key);
            return;
        }

        std::lock_guard<std::mutex> lock(cache_mutex);
        int effective_ttl = (ttl_seconds > 0) ? ttl_seconds : default_ttl_seconds;
        auto expires_at = std::chrono::system_clock::now() + std::chrono::seconds(effective_ttl);
        cache[key] = {value, expires_at};
        LOG_DEBUG("Cache: Set key '{}' with TTL {}s.", key, effective_ttl);
    }

    /**
     * @brief Retrieves an item from the cache.
     * @param key The key of the item to retrieve.
     * @return An `std::optional<std::string>` containing the value if found and not expired,
     *         otherwise an empty optional.
     */
    static std::optional<std::string> get(const std::string& key) {
        if (!initialized) {
            LOG_WARN("CacheManager not initialized. Cannot get item for key: {}", key);
            return std::nullopt;
        }

        std::lock_guard<std::mutex> lock(cache_mutex);
        auto it = cache.find(key);
        if (it != cache.end()) {
            if (std::chrono::system_clock::now() < it->second.expires_at) {
                LOG_DEBUG("Cache: Hit for key '{}'.", key);
                return it->second.value;
            } else {
                LOG_DEBUG("Cache: Miss (expired) for key '{}'. Removing.", key);
                cache.erase(it); // Remove expired item
            }
        }
        LOG_DEBUG("Cache: Miss for key '{}'.", key);
        return std::nullopt;
    }

    /**
     * @brief Removes an item from the cache.
     * @param key The key of the item to remove.
     */
    static void remove(const std::string& key) {
        if (!initialized) {
            LOG_WARN("CacheManager not initialized. Cannot remove item for key: {}", key);
            return;
        }

        std::lock_guard<std::mutex> lock(cache_mutex);
        if (cache.count(key)) {
            cache.erase(key);
            LOG_DEBUG("Cache: Removed key '{}'.", key);
        }
    }

    /**
     * @brief Clears all items from the cache.
     */
    static void clear() {
        if (!initialized) {
            LOG_WARN("CacheManager not initialized. Cannot clear cache.");
            return;
        }

        std::lock_guard<std::mutex> lock(cache_mutex);
        cache.clear();
        LOG_INFO("Cache: Cleared all items.");
    }
};

// Static members initialization
std::map<std::string, CachedItem> CacheManager::cache;
std::mutex CacheManager::cache_mutex;
int CacheManager::default_ttl_seconds = 0; // Will be set in init
bool CacheManager::initialized = false;

#endif // ML_UTILITIES_SYSTEM_CACHE_MANAGER_HPP
```