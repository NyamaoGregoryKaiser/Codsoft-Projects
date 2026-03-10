```cpp
#pragma once

#include <string>
#include <unordered_map>
#include <list>
#include <mutex>
#include <optional>
#include "../utils/Types.h"
#include "../utils/Logger.h"

namespace mlops {
namespace core {

// LRU Cache for ModelVersionDTO objects
class ModelVersionCache {
public:
    explicit ModelVersionCache(size_t capacity) : capacity_(capacity) {
        LOG_INFO("ModelVersionCache initialized with capacity: " + std::to_string(capacity_));
    }

    std::optional<ModelVersionDTO> get(int version_id) {
        std::lock_guard<std::mutex> lock(mtx_);
        auto it = map_.find(version_id);
        if (it == map_.end()) {
            return std::nullopt; // Not in cache
        }

        // Move the accessed item to the front of the list (most recently used)
        list_.splice(list_.begin(), list_, it->second);
        LOG_DEBUG("Cache HIT for model version ID: " + std::to_string(version_id));
        return *(it->second); // Return a copy of the DTO
    }

    void put(const ModelVersionDTO& version) {
        if (!version.id) {
            LOG_WARN("Cannot cache ModelVersionDTO without an ID.");
            return;
        }
        int version_id = *version.id;

        std::lock_guard<std::mutex> lock(mtx_);
        auto it = map_.find(version_id);

        if (it != map_.end()) {
            // Item already exists, update its value and move to front
            *(it->second) = version;
            list_.splice(list_.begin(), list_, it->second);
            LOG_DEBUG("Cache updated for model version ID: " + std::to_string(version_id));
        } else {
            // Item does not exist
            if (list_.size() == capacity_) {
                // Cache is full, evict the least recently used item (back of the list)
                int lru_id = *list_.back().id;
                map_.erase(lru_id);
                list_.pop_back();
                LOG_DEBUG("Cache full, evicted model version ID: " + std::to_string(lru_id));
            }
            // Add new item to front
            list_.push_front(version);
            map_[version_id] = list_.begin();
            LOG_DEBUG("Cache added model version ID: " + std::to_string(version_id));
        }
    }

    void remove(int version_id) {
        std::lock_guard<std::mutex> lock(mtx_);
        auto it = map_.find(version_id);
        if (it != map_.end()) {
            list_.erase(it->second);
            map_.erase(it);
            LOG_DEBUG("Cache removed model version ID: " + std::to_string(version_id));
        }
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mtx_);
        list_.clear();
        map_.clear();
        LOG_INFO("Cache cleared.");
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mtx_);
        return list_.size();
    }

private:
    size_t capacity_;
    std::list<ModelVersionDTO> list_; // Stores the actual items, ordered by recency
    std::unordered_map<int, std::list<ModelVersionDTO>::iterator> map_; // Maps ID to iterator in list
    mutable std::mutex mtx_; // For thread safety
};

} // namespace core
} // namespace mlops
```