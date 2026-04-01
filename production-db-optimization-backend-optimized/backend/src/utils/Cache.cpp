```cpp
#include "Cache.h"
#include "Logger.h" // For logging cache events

template<typename Key, typename Value>
InMemoryCache<Key, Value>::InMemoryCache(std::chrono::seconds default_ttl)
    : default_ttl(default_ttl) {
    LOG_INFO("Cache initialized with default TTL: {} seconds.", default_ttl.count());
}

template<typename Key, typename Value>
void InMemoryCache<Key, Value>::put(const Key& key, const Value& value, std::optional<std::chrono::seconds> ttl) {
    std::lock_guard<std::mutex> lock(cache_mutex);
    cleanupExpiredEntries(); // Clean up before adding

    std::chrono::seconds effective_ttl = ttl.value_or(default_ttl);
    auto expiry_time = std::chrono::steady_clock::now() + effective_ttl;
    cache_map[key] = {value, expiry_time};
    LOG_DEBUG("Cache: Added/Updated key '{}', TTL: {}s.", key, effective_ttl.count());
}

template<typename Key, typename Value>
std::optional<Value> InMemoryCache<Key, Value>::get(const Key& key) {
    std::lock_guard<std::mutex> lock(cache_mutex);
    cleanupExpiredEntries(); // Clean up before getting

    auto it = cache_map.find(key);
    if (it != cache_map.end()) {
        if (!isExpired(it->second)) {
            LOG_DEBUG("Cache: Hit for key '{}'.", key);
            return it->second.value;
        } else {
            LOG_DEBUG("Cache: Miss for key '{}' (expired).", key);
            cache_map.erase(it); // Remove expired entry
        }
    }
    LOG_DEBUG("Cache: Miss for key '{}' (not found).", key);
    return std::nullopt;
}

template<typename Key, typename Value>
void InMemoryCache<Key, Value>::remove(const Key& key) {
    std::lock_guard<std::mutex> lock(cache_mutex);
    if (cache_map.count(key)) {
        cache_map.erase(key);
        LOG_DEBUG("Cache: Removed key '{}'.", key);
    } else {
        LOG_DEBUG("Cache: Key '{}' not found for removal.", key);
    }
}

template<typename Key, typename Value>
void InMemoryCache<Key, Value>::clear() {
    std::lock_guard<std::mutex> lock(cache_mutex);
    cache_map.clear();
    LOG_INFO("Cache: Cleared all entries.");
}

template<typename Key, typename Value>
size_t InMemoryCache<Key, Value>::size() const {
    std::lock_guard<std::mutex> lock(cache_mutex);
    return cache_map.size();
}

template<typename Key, typename Value>
bool InMemoryCache<Key, Value>::isExpired(const CacheEntry<Value>& entry) const {
    return std::chrono::steady_clock::now() >= entry.expiry_time;
}

template<typename Key, typename Value>
void InMemoryCache<Key, Value>::cleanupExpiredEntries() {
    // This function assumes the mutex is already locked by the caller.
    for (auto it = cache_map.begin(); it != cache_map.end(); ) {
        if (isExpired(it->second)) {
            LOG_DEBUG("Cache: Expired entry removed for key '{}'.", it->first);
            it = cache_map.erase(it);
        } else {
            ++it;
        }
    }
}

// Explicit instantiations for specific types to avoid linking errors
// (Add other types as needed by your application)
template class InMemoryCache<long long, Category>;
template class InMemoryCache<long long, Manufacturer>;
template class InMemoryCache<std::string, std::vector<Category>>;
template class InMemoryCache<std::string, std::vector<Manufacturer>>;
```