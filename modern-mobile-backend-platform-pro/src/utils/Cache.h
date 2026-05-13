```cpp
#pragma once

#include <chrono>
#include <map>
#include <mutex>
#include <string>
#include <optional>
#include <any> // For storing generic data

namespace utils
{
    /**
     * @brief A simple in-memory cache with a Time-To-Live (TTL) mechanism.
     * This implementation is thread-safe.
     * In a production environment requiring distributed caching or higher performance,
     * Redis or Memcached would be preferred. This serves as a basic demonstration.
     */
    class Cache
    {
    public:
        // Delete copy constructor and assignment operator for Singleton pattern
        Cache(const Cache &) = delete;
        Cache &operator=(const Cache &) = delete;

        /**
         * @brief Get the singleton instance of the Cache.
         * @return Reference to the Cache instance.
         */
        static Cache &getInstance();

        /**
         * @brief Puts an item into the cache with a specified TTL.
         * @param key The unique key for the item.
         * @param value The value to store (can be any type).
         * @param ttlSeconds Time-to-live for the item in seconds. If 0, uses default from config.
         */
        void put(const std::string &key, std::any value, int ttlSeconds = 0);

        /**
         * @brief Retrieves an item from the cache.
         * If the item is found and not expired, its value is returned.
         * Otherwise, an empty optional is returned.
         * @param key The key of the item to retrieve.
         * @return An optional containing the item's value if found and valid, else empty.
         */
        std::optional<std::any> get(const std::string &key);

        /**
         * @brief Removes an item from the cache.
         * @param key The key of the item to remove.
         */
        void remove(const std::string &key);

        /**
         * @brief Clears all items from the cache.
         */
        void clear();

        /**
         * @brief Gets the current size of the cache (number of valid items).
         * @return The number of items in the cache.
         */
        size_t size();

    private:
        Cache(); // Private constructor for Singleton

        struct CacheEntry
        {
            std::any value;
            std::chrono::time_point<std::chrono::high_resolution_clock> expiryTime;
        };

        std::map<std::string, CacheEntry> cacheMap_;
        mutable std::mutex mutex_; // Mutable so const get methods can lock
        int defaultTtlSeconds_;

        /**
         * @brief Checks if a cache entry is expired.
         * @param entry The cache entry to check.
         * @return True if expired, false otherwise.
         */
        bool isExpired(const CacheEntry &entry) const;
    };

} // namespace utils
```