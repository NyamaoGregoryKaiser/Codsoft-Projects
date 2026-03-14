#pragma once

#include <string>
#include <json/json.h>
#include <optional>

struct Content {
    std::string id;
    std::string title;
    std::string slug;
    std::string body;
    std::string author_id;
    std::string status; // e.g., "draft", "published", "archived"
    std::string created_at;
    std::string updated_at;
    std::optional<std::string> published_at; // Can be NULL

    // Convert Content object to JSON
    Json::Value toJson() const {
        Json::Value contentJson;
        contentJson["id"] = id;
        contentJson["title"] = title;
        contentJson["slug"] = slug;
        contentJson["body"] = body;
        contentJson["author_id"] = author_id;
        contentJson["status"] = status;
        contentJson["created_at"] = created_at;
        contentJson["updated_at"] = updated_at;
        if (published_at.has_value()) {
            contentJson["published_at"] = published_at.value();
        } else {
            contentJson["published_at"] = Json::nullValue;
        }
        return contentJson;
    }
};