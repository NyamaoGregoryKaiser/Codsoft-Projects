#include "CacheService.h"
#include "utils/Logger.h"
#include <cstdarg> // For va_list, va_start, va_end

CacheService::CacheService() : context_(nullptr), host_(""), port_(0), db_(0) {}

CacheService& CacheService::instance() {
    static CacheService instance;
    return instance;
}

void CacheService::init(const std::string& host, int port, int db) {
    host_ = host;
    port_ = port;
    db_ = db;
    if (connect()) {
        LOG_INFO("CacheService (Redis) initialized and connected to {}:{}/{}", host_, port_, db_);
    } else {
        LOG_ERROR("Failed to initialize CacheService (Redis) for {}:{}/{}", host_, port_, db_);
    }
}

bool CacheService::connect() {
    if (context_) {
        redisFree(context_);
        context_ = nullptr;
    }

    struct timeval timeout = { 1, 500000 }; // 1.5 seconds
    context_ = redisConnectWithTimeout(host_.c_str(), port_, timeout);

    if (context_ == nullptr || context_->err) {
        if (context_) {
            LOG_ERROR("Redis connection error: {}", context_->errstr);
            redisFree(context_);
            context_ = nullptr;
        } else {
            LOG_ERROR("Redis connection error: Can't allocate redis context");
        }
        return false;
    }

    // Select DB
    redisReply* reply = static_cast<redisReply*>(redisCommand(context_, "SELECT %d", db_));
    if (reply == nullptr || reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis SELECT DB {} error: {}", db_, (reply ? reply->str : "Unknown error"));
        freeReplyObject(reply);
        redisFree(context_);
        context_ = nullptr;
        return false;
    }
    freeReplyObject(reply);
    return true;
}

redisReply* CacheService::runCommand(const char *format, ...) {
    std::lock_guard<std::mutex> lock(mutex_); // Protect the context

    if (!context_ && !connect()) { // Attempt to reconnect if disconnected
        LOG_ERROR("Redis connection lost and failed to reconnect.");
        return nullptr;
    }

    va_list args;
    va_start(args, format);
    redisReply* reply = static_cast<redisReply*>(redisvCommand(context_, format, args));
    va_end(args);

    if (reply == nullptr && context_->err) {
        LOG_ERROR("Redis command error: {} (Host: {}:{})", context_->errstr, host_, port_);
        // Attempt to reconnect on communication errors
        if (context_->err == REDIS_ERR_IO || context_->err == REDIS_ERR_EOF) {
            LOG_WARN("Redis connection error, attempting to reconnect...");
            if (connect()) {
                LOG_INFO("Redis reconnected successfully.");
                // Retry command after successful reconnect
                va_start(args, format);
                reply = static_cast<redisReply*>(redisvCommand(context_, format, args));
                va_end(args);
            } else {
                LOG_ERROR("Redis reconnection failed.");
            }
        }
    }
    return reply;
}

void CacheService::set(const std::string& key, const std::string& value, int ttl_seconds) {
    redisReply* reply = nullptr;
    if (ttl_seconds > 0) {
        reply = runCommand("SETEX %s %d %s", key.c_str(), ttl_seconds, value.c_str());
    } else {
        reply = runCommand("SET %s %s", key.c_str(), value.c_str());
    }

    if (reply == nullptr || reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis SET command failed for key '{}': {}", key, (reply ? reply->str : "Unknown error"));
    }
    if (reply) freeReplyObject(reply);
}

std::string CacheService::get(const std::string& key) {
    redisReply* reply = runCommand("GET %s", key.c_str());
    std::string result = "";
    if (reply && reply->type == REDIS_REPLY_STRING) {
        result = reply->str;
    } else if (reply && reply->type == REDIS_REPLY_NIL) {
        LOG_DEBUG("Redis GET command: Key '{}' not found.", key);
    } else if (reply && reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis GET command failed for key '{}': {}", key, reply->str);
    }
    if (reply) freeReplyObject(reply);
    return result;
}

bool CacheService::del(const std::string& key) {
    redisReply* reply = runCommand("DEL %s", key.c_str());
    bool deleted = false;
    if (reply && reply->type == REDIS_REPLY_INTEGER) {
        deleted = (reply->integer > 0);
    } else if (reply && reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis DEL command failed for key '{}': {}", key, reply->str);
    }
    if (reply) freeReplyObject(reply);
    return deleted;
}

bool CacheService::exists(const std::string& key) {
    redisReply* reply = runCommand("EXISTS %s", key.c_str());
    bool exists = false;
    if (reply && reply->type == REDIS_REPLY_INTEGER) {
        exists = (reply->integer == 1);
    } else if (reply && reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis EXISTS command failed for key '{}': {}", key, reply->str);
    }
    if (reply) freeReplyObject(reply);
    return exists;
}

long long CacheService::incrby(const std::string& key, long long increment, int ttl_seconds) {
    long long new_value = -1; // Indicate error
    redisReply* reply = runCommand("INCRBY %s %lld", key.c_str(), increment);
    
    if (reply && reply->type == REDIS_REPLY_INTEGER) {
        new_value = reply->integer;
        if (ttl_seconds > 0) {
            redisReply* ttl_reply = runCommand("EXPIRE %s %d", key.c_str(), ttl_seconds);
            if (ttl_reply && ttl_reply->type == REDIS_REPLY_ERROR) {
                LOG_ERROR("Redis EXPIRE command failed for key '{}': {}", key, ttl_reply->str);
            }
            if (ttl_reply) freeReplyObject(ttl_reply);
        }
    } else if (reply && reply->type == REDIS_REPLY_ERROR) {
        LOG_ERROR("Redis INCRBY command failed for key '{}': {}", key, reply->str);
    }
    if (reply) freeReplyObject(reply);
    return new_value;
}
```