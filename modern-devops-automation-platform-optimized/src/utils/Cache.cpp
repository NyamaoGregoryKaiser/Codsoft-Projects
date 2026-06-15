```cpp
#include "Cache.h"
#include "Logger.h"

namespace AppUtils {

Cache& Cache::getInstance() {
    static Cache instance;
    return instance;
}

void Cache::put(const std::string& key, const Poco::JSON::Object::Ptr& value, std::chrono::seconds ttl) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (cache_.size() >= maxSize_) {
        // Simple eviction: remove the oldest entry (could be improved with LRU)
        // For simplicity, we just log a warning for now and let new entries push out.
        // In a real LRU cache, you'd use a list or similar structure.
        LOG_WARN << "Cache reached max size (" << maxSize_ << "), consider increasing or implementing proper LRU.";
    }

    CacheEntry entry;
    entry.value = value;
    entry.expiryTime = std::chrono::system_clock::now() + ttl;
    cache_[key] = entry;
    LOG_DEBUG << "Cached item: " << key << " for " << ttl.count() << " seconds.";
}

std::optional<Poco::JSON::Object::Ptr> Cache::get(const std::string& key) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = cache_.find(key);
    if (it != cache_.end()) {
        if (std::chrono::system_clock::now() < it->second.expiryTime) {
            LOG_DEBUG << "Cache hit for key: " << key;
            return it->second.value;
        } else {
            // Expired item
            LOG_DEBUG << "Cache miss (expired) for key: " << key;
            cache_.erase(it);
        }
    }
    LOG_DEBUG << "Cache miss for key: " << key;
    return std::nullopt;
}

void Cache::remove(const std::string& key) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (cache_.erase(key) > 0) {
        LOG_DEBUG << "Removed item from cache: " << key;
    }
}

void Cache::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    cache_.clear();
    LOG_INFO << "Cache cleared.";
}

void Cache::cleanupExpiredEntries() {
    // This function can be called periodically by a background thread
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = std::chrono::system_clock::now();
    for (auto it = cache_.begin(); it != cache_.end(); ) {
        if (now >= it->second.expiryTime) {
            LOG_TRACE << "Evicting expired cache entry: " << it->first;
            it = cache_.erase(it);
        } else {
            ++it;
        }
    }
}

} // namespace AppUtils
```