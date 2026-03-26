```cpp
#pragma once

#include <string>
#include <memory>
#include <hiredis/hiredis.h> // Hiredis C client
#include "../utils/Logger.h"

/**
 * @brief Service for interacting with Redis cache.
 *
 * This class provides a simplified interface for common Redis operations
 * like setting, getting, and incrementing keys, using the hiredis library.
 * It manages the Redis connection.
 */
class CacheService {
public:
    /**
     * @brief Initializes the CacheService with Redis connection parameters.
     * @param host Redis server host.
     * @param port Redis server port.
     * @param password Redis password (optional).
     * @param dbIndex Redis database index.
     * @return True if connection successful, false otherwise.
     */
    static bool init(const std::string& host, int port,
                     const std::string& password = "", int dbIndex = 0);

    /**
     * @brief Get the shared pointer to the Redis context.
     * @return Shared pointer to the redisContext.
     * @note This is a raw hiredis context, use with care and ensure proper error checking.
     */
    static std::shared_ptr<redisContext> getContext();

    /**
     * @brief Sets a key-value pair in Redis.
     * @param key The key to set.
     * @param value The string value to store.
     * @param ttlSeconds Optional time-to-live for the key in seconds.
     * @return True if successful, false otherwise.
     */
    static bool set(const std::string& key, const std::string& value, long ttlSeconds = 0);

    /**
     * @brief Retrieves a string value from Redis.
     * @param key The key to retrieve.
     * @return An optional string value if found, std::nullopt otherwise.
     */
    static std::optional<std::string> get(const std::string& key);

    /**
     * @brief Increments the integer value of a key in Redis.
     * @param key The key to increment.
     * @param incrementBy The amount to increment by (default is 1).
     * @param ttlSeconds Optional time-to-live for the key in seconds (applied if key is new).
     * @return An optional long with the new value, std::nullopt if error.
     */
    static std::optional<long> incr(const std::string& key, long incrementBy = 1, long ttlSeconds = 0);

    /**
     * @brief Deletes a key from Redis.
     * @param key The key to delete.
     * @return True if successful, false otherwise.
     */
    static bool del(const std::string& key);

private:
    CacheService() = delete; // Prevent instantiation
    static std::shared_ptr<redisContext> s_redisContext;

    /**
     * @brief Helper function to execute a Redis command.
     * @param format The command format string (like printf).
     * @param ... Arguments for the format string.
     * @return A shared pointer to the redisReply, or nullptr on error.
     */
    static std::shared_ptr<redisReply> runCommand(const char* format, ...);

    /**
     * @brief Reconnects to Redis if the connection is lost.
     */
    static bool reconnect();
};
```