#pragma once

#include <list>
#include <unordered_map>
#include <mutex>
#include <string>
#include <chrono>

namespace DataVizPro {

template<typename Key, typename Value>
class LRUCache {
public:
    LRUCache(size_t capacity) : capacity_(capacity) {}

    // Get value from cache. Moves key to front (MRU).
    std::pair<bool, Value> get(const Key& key) {
        std::lock_guard<std::mutex> lock(mtx_);
        auto it = cache_map_.find(key);
        if (it == cache_map_.end()) {
            return {false, Value()}; // Not found
        }
        // Move to front (most recently used)
        cache_list_.splice(cache_list_.begin(), cache_list_, it->second.second);
        return {true, it->second.first}; // Found
    }

    // Put value into cache. Adds/moves key to front (MRU).
    void put(const Key& key, const Value& value) {
        std::lock_guard<std::mutex> lock(mtx_);
        auto it = cache_map_.find(key);

        if (it != cache_map_.end()) {
            // Key exists, update value and move to front
            it->second.first = value;
            cache_list_.splice(cache_list_.begin(), cache_list_, it->second.second);
        } else {
            // Key does not exist
            if (cache_map_.size() == capacity_) {
                // Cache is full, evict LRU item
                const Key& lru_key = cache_list_.back();
                cache_map_.erase(lru_key);
                cache_list_.pop_back();
            }
            // Add new item to front
            cache_list_.push_front(key);
            cache_map_[key] = {value, cache_list_.begin()};
        }
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mtx_);
        return cache_map_.size();
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mtx_);
        cache_map_.clear();
        cache_list_.clear();
    }

private:
    size_t capacity_;
    std::list<Key> cache_list_; // Stores keys in MRU to LRU order
    std::unordered_map<Key, std::pair<Value, typename std::list<Key>::iterator>> cache_map_; // Key -> {Value, ListIterator}
    mutable std::mutex mtx_; // For thread safety
};

} // namespace DataVizPro
```