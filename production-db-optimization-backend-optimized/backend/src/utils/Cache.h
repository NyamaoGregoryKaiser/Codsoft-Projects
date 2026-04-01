```cpp
#ifndef CACHE_H
#define CACHE_H

#include <map>
#include <mutex>
#include <string>
#include <chrono>
#include <optional>
#include <vector>
#include "database/Models.h" // For cached types

template<typename T>
struct CacheEntry {
    T value;
    std::chrono::steady_clock::time_point expiry_time;
};

// Generic in-memory cache
template<typename Key, typename Value>
class InMemoryCache {
public:
    InMemoryCache(std::chrono::seconds default_ttl = std::chrono::minutes(5));

    void put(const Key& key, const Value& value, std::optional<std::chrono::seconds> ttl = std::nullopt);
    std::optional<Value> get(const Key& key);
    void remove(const Key& key);
    void clear();
    size_t size() const;

private:
    std::map<Key, CacheEntry<Value>> cache_map;
    mutable std::mutex cache_mutex; // mutable for const methods that modify mutex
    std::chrono::seconds default_ttl;

    bool isExpired(const CacheEntry<Value>& entry) const;
    void cleanupExpiredEntries();
};

// Explicit instantiations for common types to be cached (Categories, Manufacturers)
extern template class InMemoryCache<long long, Category>;
extern template class InMemoryCache<long long, Manufacturer>;
extern template class InMemoryCache<std::string, std::vector<Category>>; // e.g., for all categories
extern template class InMemoryCache<std::string, std::vector<Manufacturer>>; // e.g., for all manufacturers

#endif // CACHE_H
```