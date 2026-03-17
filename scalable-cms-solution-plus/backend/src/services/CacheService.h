#pragma once

#include <string>
#include <memory>
#include <hiredis/hiredis.h>
#include <mutex>
#include <functional>
#include <vector>

class CacheService {
public:
    static CacheService& instance();

    // Initializes the Redis client. Must be called once at startup.
    void init(const std::string& host, int port, int db = 0);

    // Puts a string value into the cache.
    // @param key The cache key.
    // @param value The string value.
    // @param ttl_seconds Time-to-live in seconds. 0 for no expiry.
    void set(const std::string& key, const std::string& value, int ttl_seconds = 0);

    // Gets a string value from the cache.
    // @param key The cache key.
    // @return The string value if found, empty string otherwise.
    std::string get(const std::string& key);

    // Deletes a key from the cache.
    // @param key The cache key.
    // @return True if key was deleted, false if not found.
    bool del(const std::string& key);

    // Checks if a key exists in the cache.
    // @param key The cache key.
    // @return True if key exists, false otherwise.
    bool exists(const std::string& key);

    // Increments the integer value of a key. If the key does not exist, it is set to 0 before performing the operation.
    // @param key The cache key.
    // @param increment The amount to increment by.
    // @param ttl_seconds Time-to-live in seconds for new keys.
    // @return The new value of the key.
    long long incrby(const std::string& key, long long increment = 1, int ttl_seconds = 0);

private:
    CacheService();
    CacheService(const CacheService&) = delete;
    CacheService& operator=(const CacheService&) = delete;

    redisContext* context_;
    std::string host_;
    int port_;
    int db_;
    std::mutex mutex_; // For thread safety with hiredis context

    // Helper to connect to Redis
    bool connect();
    // Helper to execute a Redis command and handle replies
    redisReply* runCommand(const char *format, ...);
};
```