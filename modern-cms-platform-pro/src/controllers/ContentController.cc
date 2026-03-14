#include "ContentController.h"
#include "services/ContentService.h"
#include "utils/ApiResponse.h"
#include "models/User.h" // To get user_id from req context

void ContentController::getAllContent(const drogon::HttpRequestPtr &req,
                                       std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Fetching all content.";
    ContentService::getInstance()->getAllContent(
        [callback](const std::vector<Content>& contents, const std::string& error) {
            if (!error.empty()) {
                LOG_ERROR << "Failed to retrieve content: " << error;
                return callback(ApiResponse::internalError("Failed to retrieve content."));
            }
            Json::Value data = Json::arrayValue;
            for (const auto& c : contents) {
                data.append(c.toJson());
            }
            return callback(ApiResponse::ok("Content retrieved successfully.", data));
        }
    );
}

void ContentController::getContentById(const drogon::HttpRequestPtr &req,
                                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                        const std::string &id) {
    LOG_INFO << "Fetching content by ID: " << id;
    ContentService::getInstance()->getContentById(id,
        [callback](const std::optional<Content>& content, const std::string& error) {
            if (!error.empty()) {
                LOG_ERROR << "Failed to retrieve content by ID: " << error;
                return callback(ApiResponse::internalError("Failed to retrieve content."));
            }
            if (!content) {
                return callback(ApiResponse::notFound("Content not found."));
            }
            return callback(ApiResponse::ok("Content retrieved successfully.", content->toJson()));
        }
    );
}

void ContentController::createContent(const drogon::HttpRequestPtr &req,
                                       std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    LOG_INFO << "Creating new content.";
    auto json = req->getJsonObject();
    if (!json || !json->isMember("title") || !json->isMember("body")) {
        return callback(ApiResponse::badRequest("Missing title or body."));
    }

    // Get author_id from request context (set by AuthMiddleware)
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty()) {
        return callback(ApiResponse::unauthorized("User information not found in token."));
    }

    Content content;
    content.title = (*json)["title"].asString();
    content.body = (*json)["body"].asString();
    content.author_id = user.id;
    content.slug = drogon::utils::urlEncode(content.title); // Simple slug generation
    if (json->isMember("status")) {
        content.status = (*json)["status"].asString();
    } else {
        content.status = "draft";
    }

    ContentService::getInstance()->createContent(content,
        [callback](const std::optional<Content>& newContent, const std::string& error) {
            if (!error.empty()) {
                LOG_ERROR << "Failed to create content: " << error;
                return callback(ApiResponse::internalError("Failed to create content."));
            }
            if (!newContent) {
                 return callback(ApiResponse::internalError("Failed to create content, no content returned."));
            }
            return callback(ApiResponse::created("Content created successfully.", newContent->toJson()));
        }
    );
}

void ContentController::updateContent(const drogon::HttpRequestPtr &req,
                                       std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                       const std::string &id) {
    LOG_INFO << "Updating content with ID: " << id;
    auto json = req->getJsonObject();
    if (!json) {
        return callback(ApiResponse::badRequest("Invalid JSON payload."));
    }

    // Get author_id from request context for authorization check
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty()) {
        return callback(ApiResponse::unauthorized("User information not found in token."));
    }

    ContentService::getInstance()->updateContent(id, user.id, *json,
        [callback](const std::optional<Content>& updatedContent, const std::string& error) {
            if (!error.empty()) {
                if (error == "Not Found") {
                    return callback(ApiResponse::notFound("Content not found or not authorized to update."));
                }
                LOG_ERROR << "Failed to update content: " << error;
                return callback(ApiResponse::internalError("Failed to update content."));
            }
            if (!updatedContent) {
                 return callback(ApiResponse::internalError("Failed to update content, no content returned."));
            }
            return callback(ApiResponse::ok("Content updated successfully.", updatedContent->toJson()));
        }
    );
}

void ContentController::deleteContent(const drogon::HttpRequestPtr &req,
                                       std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                                       const std::string &id) {
    LOG_INFO << "Deleting content with ID: " << id;
    // Get author_id from request context for authorization check
    auto user = req->getAttributes()->get<User>("user_info");
    if (user.id.empty()) {
        return callback(ApiResponse::unauthorized("User information not found in token."));
    }

    ContentService::getInstance()->deleteContent(id, user.id,
        [callback](bool success, const std::string& error) {
            if (!error.empty()) {
                if (error == "Not Found") {
                    return callback(ApiResponse::notFound("Content not found or not authorized to delete."));
                }
                LOG_ERROR << "Failed to delete content: " << error;
                return callback(ApiResponse::internalError("Failed to delete content."));
            }
            if (!success) {
                 return callback(ApiResponse::internalError("Failed to delete content."));
            }
            return callback(ApiResponse::noContent());
        }
    );
}