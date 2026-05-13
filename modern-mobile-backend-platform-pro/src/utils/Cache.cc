```cpp
#include "Cache.h"
#include "Logger.h"
#include "AppConfig.h" // For reading default TTL from config

namespace utils
{
    Cache::Cache()
    {
        defaultTtlSeconds_ = AppConfig::getInstance().getInt("cache.ttlSeconds", 300); // Default to 300 seconds (5 minutes)
        if (defaultTtlSeconds_ <= 0) {
            LOG_WARN("Cache TTL is set to {} seconds, defaulting to 300.", defaultTtlSeconds_);
            defaultTtlSeconds_ = 300;
        }
        LOG_INFO("Cache initialized with default TTL: {} seconds.", defaultTtlSeconds_);
    }

    Cache &Cache::getInstance()
    {
        static Cache instance;
        return instance;
    }

    void Cache::put(const std::string &key, std::any value, int ttlSeconds)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        if (ttlSeconds <= 0) {
            ttlSeconds = defaultTtlSeconds_;
        }

        CacheEntry entry;
        entry.value = std::move(value);
        entry.expiryTime = std::chrono::high_resolution_clock::now() + std::chrono::seconds(ttlSeconds);

        cacheMap_[key] = entry;
        LOG_DEBUG("Cache: Put item with key '{}', TTL: {}s", key, ttlSeconds);
    }

    std::optional<std::any> Cache::get(const std::string &key)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = cacheMap_.find(key);
        if (it != cacheMap_.end())
        {
            if (!isExpired(it->second))
            {
                LOG_DEBUG("Cache: Hit for key '{}'", key);
                return it->second.value;
            }
            else
            {
                LOG_DEBUG("Cache: Miss for expired key '{}', removing.", key);
                cacheMap_.erase(it); // Remove expired item
            }
        }
        LOG_DEBUG("Cache: Miss for key '{}'", key);
        return std::nullopt;
    }

    void Cache::remove(const std::string &key)
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto erasedCount = cacheMap_.erase(key);
        if (erasedCount > 0) {
            LOG_DEBUG("Cache: Removed item with key '{}'", key);
        } else {
            LOG_DEBUG("Cache: Attempted to remove non-existent key '{}'", key);
        }
    }

    void Cache::clear()
    {
        std::lock_guard<std::mutex> lock(mutex_);
        cacheMap_.clear();
        LOG_INFO("Cache: Cleared all items.");
    }

    size_t Cache::size()
    {
        std::lock_guard<std::mutex> lock(mutex_);
        // Clean up expired items before returning size
        for (auto it = cacheMap_.begin(); it != cacheMap_.end(); ) {
            if (isExpired(it->second)) {
                it = cacheMap_.erase(it);
            } else {
                ++it;
            }
        }
        return cacheMap_.size();
    }

    bool Cache::isExpired(const CacheEntry &entry) const
    {
        return std::chrono::high_resolution_clock::now() > entry.expiryTime;
    }

} // namespace utils
```