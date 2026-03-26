```cpp
#include "CacheService.h"
#include <stdexcept>
#include <cstdarg> // For va_list, va_start, va_end

// Static member definition
std::shared_ptr<redisContext> CacheService::s_redisContext = nullptr;
static std::string s_redisHost;
static int s_redisPort;
static std::string s_redisPassword;
static int s_redisDbIndex;

bool CacheService::init(const std::string& host, int port,
                        const std::string& password, int dbIndex) {
    s_redisHost = host;
    s_redisPort = port;
    s_redisPassword = password;
    s_redisDbIndex = dbIndex;

    LOG_INFO("Attempting to connect to Redis at {}:{} (DB {})", host, port, dbIndex);
    redisContext* c = redisConnect(host.c_str(), port);

    if (c == nullptr || c->err) {
        if (c) {
            LOG_CRITICAL("Redis Connection error: {}", c->errstr);
            redisFree(c);
        } else {
            LOG_CRITICAL("Redis Connection error: Can't allocate redis context.");
        }
        return false;
    }

    // Authenticate if password is provided
    if (!password.empty()) {
        std::shared_ptr<redisReply> reply(
            (redisReply*)redisCommand(c, "AUTH %s", password.c_str()),
            [](redisReply* r) { if (r) freeReplyObject(r); }
        );
        if (!reply || reply->type == REDIS_REPLY_ERROR) {
            LOG_CRITICAL("Redis Authentication failed: {}", reply ? reply->str : "Unknown error");
            redisFree(c);
            return false;
        }
    }

    // Select database
    if (dbIndex >= 0) {
        std::shared_ptr<redisReply> reply(
            (redisReply*)redisCommand(c, "SELECT %d", dbIndex),
            [](redisReply* r) { if (r) freeReplyObject(r); }
        );
        if (!reply || reply->type == REDIS_REPLY_ERROR) {
            LOG_CRITICAL("Redis SELECT DB failed: {}", reply ? reply->str : "Unknown error");
            redisFree(c);
            return false;
        }
    }

    s_redisContext.reset(c, [](redisContext* ctx) {
        if (ctx) redisFree(ctx);
    });
    LOG_INFO("Successfully connected to Redis at {}:{} (DB {})", host, port, dbIndex);
    return true;
}

std::shared_ptr<redisContext> CacheService::getContext() {
    if (!s_redisContext) {
        LOG_WARN("Redis context not initialized. Attempting re-initialization.");
        init(s_redisHost, s_redisPort, s_redisPassword, s_redisDbIndex); // Attempt to re-init with stored params
        if (!s_redisContext) { // If still null after re-init attempt
            throw std::runtime_error("Redis context not available.");
        }
    }
    return s_redisContext;
}

std::shared_ptr<redisReply> CacheService::runCommand(const char* format, ...) {
    std::shared_ptr<redisContext> ctx = getContext();
    if (!ctx) {
        LOG_ERROR("Redis context is null, cannot run command.");
        return nullptr;
    }

    va_list args;
    va_start(args, format);
    redisReply* reply = (redisReply*)redisvCommand(ctx.get(), format, args);
    va_end(args);

    if (!reply && (ctx->err == REDIS_ERR_EOF || ctx->err == REDIS_ERR_IO)) {
        LOG_WARN("Redis connection lost ({}). Attempting to reconnect...", ctx->errstr);
        if (reconnect()) {
            // Retry command after reconnect
            va_list retry_args;
            va_start(retry_args, format);
            reply = (redisReply*)redisvCommand(ctx.get(), format, retry_args);
            va_end(retry_args);
        } else {
            LOG_ERROR("Failed to reconnect to Redis.");
        }
    }

    if (!reply) {
        LOG_ERROR("Redis command failed. Error: {}", ctx->errstr);
        return nullptr;
    }

    return std::shared_ptr<redisReply>(reply, [](redisReply* r) { if (r) freeReplyObject(r); });
}

bool CacheService::reconnect() {
    LOG_INFO("Reconnecting to Redis at {}:{} (DB {})...", s_redisHost, s_redisPort, s_redisDbIndex);
    s_redisContext.reset(); // Release old context
    return init(s_redisHost, s_redisPort, s_redisPassword, s_redisDbIndex);
}

bool CacheService::set(const std::string& key, const std::string& value, long ttlSeconds) {
    std::shared_ptr<redisReply> reply;
    if (ttlSeconds > 0) {
        reply = runCommand("SET %s %s EX %ld", key.c_str(), value.c_str(), ttlSeconds);
    } else {
        reply = runCommand("SET %s %s", key.c_str(), value.c_str());
    }

    if (reply && reply->type == REDIS_REPLY_STATUS && std::string(reply->str) == "OK") {
        LOG_DEBUG("Redis SET key: {}, value: {}", key, value);
        return true;
    }
    LOG_ERROR("Redis SET failed for key {}", key);
    return false;
}

std::optional<std::string> CacheService::get(const std::string& key) {
    std::shared_ptr<redisReply> reply = runCommand("GET %s", key.c_str());
    if (reply && reply->type == REDIS_REPLY_STRING) {
        LOG_DEBUG("Redis GET key: {}, value: {}", key, reply->str);
        return std::string(reply->str);
    } else if (reply && reply->type == REDIS_REPLY_NIL) {
        LOG_DEBUG("Redis GET key: {} - Not found.", key);
        return std::nullopt;
    }
    LOG_ERROR("Redis GET failed for key {}", key);
    return std::nullopt;
}

std::optional<long> CacheService::incr(const std::string& key, long incrementBy, long ttlSeconds) {
    // Check if key exists. If not, set it with TTL and then INCR.
    // This isn't atomic for initial set + TTL, but good enough for simple rate limiting.
    // For true atomicity with initial value and TTL, use Lua scripts or SETNX + EXPIRE.
    // Here we'll do: GET, if not exist SET 0 EX TTL, then INCR.
    std::shared_ptr<redisReply> reply_get = runCommand("GET %s", key.c_str());
    if (reply_get && reply_get->type == REDIS_REPLY_NIL && ttlSeconds > 0) {
        // Key doesn't exist, set it to 0 with TTL
        runCommand("SET %s %d EX %ld", key.c_str(), 0, ttlSeconds);
    }
    
    std::shared_ptr<redisReply> reply = runCommand("INCRBY %s %ld", key.c_str(), incrementBy);
    if (reply && reply->type == REDIS_REPLY_INTEGER) {
        LOG_DEBUG("Redis INCR key: {}, new value: {}", key, reply->integer);
        return reply->integer;
    }
    LOG_ERROR("Redis INCR failed for key {}", key);
    return std::nullopt;
}

bool CacheService::del(const std::string& key) {
    std::shared_ptr<redisReply> reply = runCommand("DEL %s", key.c_str());
    if (reply && reply->type == REDIS_REPLY_INTEGER && reply->integer > 0) {
        LOG_DEBUG("Redis DEL key: {}", key);
        return true;
    } else if (reply && reply->type == REDIS_REPLY_INTEGER && reply->integer == 0) {
        LOG_DEBUG("Redis DEL key: {} - Not found.", key);
        return true; // Key didn't exist, but operation technically "succeeded"
    }
    LOG_ERROR("Redis DEL failed for key {}", key);
    return false;
}
```