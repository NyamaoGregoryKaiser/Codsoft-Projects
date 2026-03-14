#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <json/json.h>
#include <string>
#include <vector>
#include <optional>
#include <functional>
#include "models/Content.h"

// For asynchronous operations
using ContentListCallback = std::function<void(const std::vector<Content>&, const std::string&)>;
using ContentCallback = std::function<void(const std::optional<Content>&, const std::string&)>;
using GenericCallback = std::function<void(bool, const std::string&)>;

class ContentService {
public:
    static ContentService* getInstance();

    void getAllContent(ContentListCallback callback);

    void getContentById(const std::string& id,
                        ContentCallback callback);

    void createContent(const Content& content,
                       ContentCallback callback);

    void updateContent(const std::string& id,
                       const std::string& userId, // For authorization
                       const Json::Value& updates,
                       ContentCallback callback);

    void deleteContent(const std::string& id,
                       const std::string& userId, // For authorization
                       GenericCallback callback);

private:
    ContentService();
    ~ContentService() = default;
    ContentService(const ContentService&) = delete;
    ContentService& operator=(const ContentService&) = delete;

    drogon::orm::DbClientPtr dbClient;
};