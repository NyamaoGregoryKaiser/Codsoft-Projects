#include "ContentService.h"
#include <drogon/utils/Utilities.h> // For drogon::utils::get ==>(utc time

ContentService* ContentService::getInstance() {
    static ContentService instance;
    return &instance;
}

ContentService::ContentService() {
    dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        LOG_FATAL << "Database client not initialized. Check config.json and DB connection.";
    }
}

void ContentService::getAllContent(ContentListCallback callback) {
    std::string sql = "SELECT id, title, slug, body, author_id, status, created_at, updated_at, published_at FROM content ORDER BY published_at DESC, created_at DESC";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            std::vector<Content> contents;
            for (const auto& row : result) {
                Content content;
                content.id = row["id"].as<std::string>();
                content.title = row["title"].as<std::string>();
                content.slug = row["slug"].as<std::string>();
                content.body = row["body"].as<std::string>();
                content.author_id = row["author_id"].as<std::string>();
                content.status = row["status"].as<std::string>();
                content.created_at = row["created_at"].as<std::string>();
                content.updated_at = row["updated_at"].as<std::string>();
                if (!row["published_at"].isNull()) {
                    content.published_at = row["published_at"].as<std::string>();
                }
                contents.push_back(content);
            }
            callback(contents, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error fetching all content: " << e.what();
            callback({}, e.what());
        }
    );
}

void ContentService::getContentById(const std::string& id, ContentCallback callback) {
    std::string sql = "SELECT id, title, slug, body, author_id, status, created_at, updated_at, published_at FROM content WHERE id = $1";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback(std::nullopt, "");
                return;
            }
            Content content;
            content.id = result[0]["id"].as<std::string>();
            content.title = result[0]["title"].as<std::string>();
            content.slug = result[0]["slug"].as<std::string>();
            content.body = result[0]["body"].as<std::string>();
            content.author_id = result[0]["author_id"].as<std::string>();
            content.status = result[0]["status"].as<std::string>();
            content.created_at = result[0]["created_at"].as<std::string>();
            content.updated_at = result[0]["updated_at"].as<std::string>();
            if (!result[0]["published_at"].isNull()) {
                content.published_at = result[0]["published_at"].as<std::string>();
            }
            callback(content, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error fetching content by ID: " << e.what();
            callback(std::nullopt, e.what());
        },
        id
    );
}

void ContentService::createContent(const Content& content, ContentCallback callback) {
    std::string sql = "INSERT INTO content (title, slug, body, author_id, status, published_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, slug, body, author_id, status, created_at, updated_at, published_at";

    std::optional<std::string> published_at_val;
    if (content.status == "published") {
        published_at_val = drogon::utils::getGmtTime(); // Current UTC time
    }

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback(std::nullopt, "Failed to insert content, no data returned.");
                return;
            }
            Content newContent;
            newContent.id = result[0]["id"].as<std::string>();
            newContent.title = result[0]["title"].as<std::string>();
            newContent.slug = result[0]["slug"].as<std::string>();
            newContent.body = result[0]["body"].as<std::string>();
            newContent.author_id = result[0]["author_id"].as<std::string>();
            newContent.status = result[0]["status"].as<std::string>();
            newContent.created_at = result[0]["created_at"].as<std::string>();
            newContent.updated_at = result[0]["updated_at"].as<std::string>();
            if (!result[0]["published_at"].isNull()) {
                newContent.published_at = result[0]["published_at"].as<std::string>();
            }
            callback(newContent, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error creating content: " << e.what();
            callback(std::nullopt, e.what());
        },
        content.title, content.slug, content.body, content.author_id, content.status, published_at_val
    );
}

void ContentService::updateContent(const std::string& id, const std::string& userId, const Json::Value& updates, ContentCallback callback) {
    std::string sql = "UPDATE content SET ";
    std::vector<std::string> clauses;
    std::vector<drogon::orm::FieldType> params;
    int param_idx = 1;

    if (updates.isMember("title") && updates["title"].isString()) {
        clauses.push_back("title = $" + std::to_string(param_idx++));
        params.push_back(updates["title"].asString());
    }
    if (updates.isMember("slug") && updates["slug"].isString()) {
        clauses.push_back("slug = $" + std::to_string(param_idx++));
        params.push_back(updates["slug"].asString());
    }
    if (updates.isMember("body") && updates["body"].isString()) {
        clauses.push_back("body = $" + std::to_string(param_idx++));
        params.push_back(updates["body"].asString());
    }
    if (updates.isMember("status") && updates["status"].isString()) {
        std::string new_status = updates["status"].asString();
        clauses.push_back("status = $" + std::to_string(param_idx++));
        params.push_back(new_status);
        if (new_status == "published") {
            clauses.push_back("published_at = $" + std::to_string(param_idx++));
            params.push_back(drogon::utils::getGmtTime());
        } else if (new_status == "draft" || new_status == "archived") {
            // If changing from published to draft/archived, clear published_at
            clauses.push_back("published_at = $" + std::to_string(param_idx++));
            params.push_back(std::string()); // NULL
        }
    }

    if (clauses.empty()) {
        callback(std::nullopt, "No valid fields provided for update.");
        return;
    }

    sql += drogon::utils::join(clauses, ", ") + " WHERE id = $" + std::to_string(param_idx++) + " AND author_id = $" + std::to_string(param_idx++) + " RETURNING id, title, slug, body, author_id, status, created_at, updated_at, published_at";
    params.push_back(id);
    params.push_back(userId); // Ensure only author can update

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.empty()) {
                callback(std::nullopt, "Not Found"); // Content not found or not authorized
                return;
            }
            Content updatedContent;
            updatedContent.id = result[0]["id"].as<std::string>();
            updatedContent.title = result[0]["title"].as<std::string>();
            updatedContent.slug = result[0]["slug"].as<std::string>();
            updatedContent.body = result[0]["body"].as<std::string>();
            updatedContent.author_id = result[0]["author_id"].as<std::string>();
            updatedContent.status = result[0]["status"].as<std::string>();
            updatedContent.created_at = result[0]["created_at"].as<std::string>();
            updatedContent.updated_at = result[0]["updated_at"].as<std::string>();
            if (!result[0]["published_at"].isNull()) {
                updatedContent.published_at = result[0]["published_at"].as<std::string>();
            }
            callback(updatedContent, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error updating content: " << e.what();
            callback(std::nullopt, e.what());
        },
        params
    );
}

void ContentService::deleteContent(const std::string& id, const std::string& userId, GenericCallback callback) {
    std::string sql = "DELETE FROM content WHERE id = $1 AND author_id = $2";

    dbClient->execSqlAsync(sql,
        [callback](const drogon::orm::Result& result) {
            if (result.affectedRows() == 0) {
                callback(false, "Not Found"); // Content not found or not authorized
                return;
            }
            callback(true, "");
        },
        [callback](const drogon::orm::DrogonDbException& e) {
            LOG_ERROR << "DB Error deleting content: " << e.what();
            callback(false, e.what());
        },
        id, userId
    );
}