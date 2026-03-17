#include "PostController.h"
#include "utils/Logger.h"
#include "database/DbClientManager.h"
#include "common/Constants.h"
#include "common/Enums.h"

#include <drogon/orm/Mapper.h>
#include <drogon/orm/Criteria.h>
#include <drogon/orm/Exception.h>
#include "models/Post.h"     // Generated Post model
#include "models/User.h"     // To check post ownership
#include "models/Category.h" // To check if category exists

namespace cms {

drogon::HttpResponsePtr PostController::createErrorResponse(drogon::HttpStatusCode code, const std::string& message) {
    Json::Value json;
    json["error"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(code);
    return resp;
}

drogon::HttpResponsePtr PostController::createSuccessResponse(const Json::Value& data) {
    auto resp = drogon::HttpResponse::newHttpJsonResponse(data);
    resp->setStatusCode(drogon::k200OK);
    return resp;
}

drogon::HttpResponsePtr PostController::createPostResponseJson(const drogon_model::cms_system::Post& post) {
    Json::Value postJson;
    postJson["id"] = post.getId();
    postJson["title"] = post.getTitle();
    postJson["content"] = post.getContent();
    postJson["slug"] = post.getSlug();
    postJson["status"] = postStatusToString(post.getStatus());
    postJson["authorId"] = post.getAuthorId();
    postJson["categoryId"] = post.getCategoryId().value_or(""); // Optional field
    postJson["publishedAt"] = post.getPublishedAt().has_value() ? drogon::utils::get<std::string>(post.getPublishedAt().value()) : "";
    postJson["createdAt"] = drogon::utils::get<std::string>(post.getCreatedAt());
    postJson["updatedAt"] = drogon::utils::get<std::string>(post.getUpdatedAt());
    return createSuccessResponse(postJson);
}

void PostController::createPost(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for createPost.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string authorId = req->attributes()->get<std::string>("user_id");

    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("title") || !json->isMember("content")) {
            LOG_WARN("Bad request for createPost: Missing title or content.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        std::string title = (*json)["title"].asString();
        std::string content = (*json)["content"].asString();
        std::string categoryId = json->isMember("categoryId") ? (*json)["categoryId"].asString() : "";

        if (title.empty() || content.empty()) {
            LOG_WARN("Bad request for createPost: Empty title or content.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        // Validate category if provided
        if (!categoryId.empty()) {
            drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
            auto category = categoryMapper.findByPrimaryKey(categoryId);
            if (!category) {
                LOG_WARN("Category ID {} not found for new post.", categoryId);
                return callback(createErrorResponse(drogon::k400BadRequest, "Invalid category ID."));
            }
        }

        drogon_model::cms_system::Post newPost;
        newPost.setTitle(title);
        newPost.setContent(content);
        newPost.setAuthorId(authorId);
        newPost.setStatus(PostStatus::DRAFT); // New posts start as drafts
        newPost.setSlug(drogon::utils::generateUuid()); // Simple slug for now
        if (!categoryId.empty()) {
            newPost.setCategoryId(categoryId);
        }

        drogon_model::cms_system::Post createdPost = drogon::orm::Mapper<drogon_model::cms_system::Post>(dbClient).insertAndGetId(newPost);
        LOG_INFO("Post '{}' created by User ID {} as a draft.", createdPost.getTitle(), authorId);
        callback(createPostResponseJson(createdPost));

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during createPost: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error during createPost: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in createPost endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::getAllPosts(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getAllPosts.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        std::vector<drogon_model::cms_system::Post> posts;
        std::string userId = "";
        cms::UserRole userRole = cms::UserRole::GUEST;

        if (req->attributes()->find("user_id") && req->attributes()->find("user_role")) {
            userId = req->attributes()->get<std::string>("user_id");
            userRole = req->attributes()->get<cms::UserRole>("user_role");
        }

        if (userRole == cms::UserRole::GUEST) {
            // Only fetch published posts for guests
            posts = postMapper.findBy(drogon::orm::Criteria("status", drogon::orm::CompareOperator::EQ, static_cast<int>(PostStatus::PUBLISHED)));
        } else {
            // Authenticated users can see all posts they own, and all published posts
            posts = postMapper.findBy(
                drogon::orm::Criteria("status", drogon::orm::CompareOperator::EQ, static_cast<int>(PostStatus::PUBLISHED))
                || drogon::orm::Criteria("author_id", drogon::orm::CompareOperator::EQ, userId)
            );
        }
        
        // Sorting (optional)
        std::sort(posts.begin(), posts.end(), [](const drogon_model::cms_system::Post& a, const drogon_model::cms_system::Post& b) {
            return a.getUpdatedAt() > b.getUpdatedAt(); // Newest first
        });

        Json::Value postsArray;
        for (const auto& post : posts) {
            Json::Value postJson;
            postJson["id"] = post.getId();
            postJson["title"] = post.getTitle();
            postJson["content"] = post.getContent();
            postJson["slug"] = post.getSlug();
            postJson["status"] = postStatusToString(post.getStatus());
            postJson["authorId"] = post.getAuthorId();
            postJson["categoryId"] = post.getCategoryId().value_or("");
            postJson["publishedAt"] = post.getPublishedAt().has_value() ? drogon::utils::get<std::string>(post.getPublishedAt().value()) : "";
            postJson["createdAt"] = drogon::utils::get<std::string>(post.getCreatedAt());
            postJson["updatedAt"] = drogon::utils::get<std::string>(post.getUpdatedAt());
            postsArray.append(postJson);
        }
        callback(createSuccessResponse(postsArray));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching all posts: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getAllPosts endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::getPostById(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                 std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getPostById.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        auto post = postMapper.findByPrimaryKey(id);
        if (post) {
            std::string userId = "";
            cms::UserRole userRole = cms::UserRole::GUEST;

            if (req->attributes()->find("user_id") && req->attributes()->find("user_role")) {
                userId = req->attributes()->get<std::string>("user_id");
                userRole = req->attributes()->get<cms::UserRole>("user_role");
            }

            // Allow access if published, or if authenticated user is author/admin/editor
            if (post->getStatus() == PostStatus::PUBLISHED ||
                post->getAuthorId() == userId ||
                userRole == cms::UserRole::ADMIN ||
                userRole == cms::UserRole::EDITOR) {
                callback(createPostResponseJson(*post));
            } else {
                LOG_WARN("Unauthorized access attempt to post ID {} (status: {}). User ID: {}, Role: {}",
                         id, postStatusToString(post->getStatus()), userId, userRoleToString(userRole));
                callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND)); // Treat as not found to avoid leaking info
            }
        } else {
            LOG_WARN("Post with ID {} not found.", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching post by ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getPostById endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::updatePost(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for updatePost.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string userId = req->attributes()->get<std::string>("user_id");
    cms::UserRole userRole = req->attributes()->get<cms::UserRole>("user_role");

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        auto postOpt = postMapper.findByPrimaryKey(id);
        if (!postOpt) {
            LOG_WARN("Attempt to update non-existent post with ID: {}", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::Post postToUpdate = *postOpt;

        // Authorization: Only author or Admin/Editor can update
        if (postToUpdate.getAuthorId() != userId &&
            userRole != cms::UserRole::ADMIN &&
            userRole != cms::UserRole::EDITOR) {
            LOG_WARN("User ID {} (Role {}) attempted to update post ID {} (Author {}), but is not authorized.",
                     userId, userRoleToString(userRole), id, postToUpdate.getAuthorId());
            return callback(createErrorResponse(drogon::k403Forbidden, ERR_FORBIDDEN));
        }

        auto json = req->getJsonObject();
        if (!json) {
            LOG_WARN("Bad request for updatePost: No JSON body provided.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        bool changed = false;
        if (json->isMember("title") && (*json)["title"].isString()) {
            std::string newTitle = (*json)["title"].asString();
            if (newTitle != postToUpdate.getTitle()) {
                postToUpdate.setTitle(newTitle);
                changed = true;
            }
        }
        if (json->isMember("content") && (*json)["content"].isString()) {
            std::string newContent = (*json)["content"].asString();
            if (newContent != postToUpdate.getContent()) {
                postToUpdate.setContent(newContent);
                changed = true;
            }
        }
        if (json->isMember("categoryId") && (*json)["categoryId"].isString()) {
            std::string newCategoryId = (*json)["categoryId"].asString();
            if (postToUpdate.getCategoryId().value_or("") != newCategoryId) {
                // Validate new category
                drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
                auto category = categoryMapper.findByPrimaryKey(newCategoryId);
                if (!category) {
                    LOG_WARN("Invalid category ID {} provided for post update.", newCategoryId);
                    return callback(createErrorResponse(drogon::k400BadRequest, "Invalid category ID."));
                }
                postToUpdate.setCategoryId(newCategoryId);
                changed = true;
            }
        }
        if (json->isMember("slug") && (*json)["slug"].isString()) { // Allow changing slug
            std::string newSlug = (*json)["slug"].asString();
            if (newSlug != postToUpdate.getSlug()) {
                // Consider adding slug uniqueness check here
                postToUpdate.setSlug(newSlug);
                changed = true;
            }
        }

        // Status change is handled by publish/draft endpoints or if an Admin/Editor explicitly sets it
        // A regular user cannot change the status directly via update
        if (json->isMember("status") && (*json)["status"].isString()) {
            cms::PostStatus newStatus = stringToPostStatus((*json)["status"].asString());
            if (newStatus != postToUpdate.getStatus()) {
                if (userRole == cms::UserRole::ADMIN || userRole == cms::UserRole::EDITOR) {
                    postToUpdate.setStatus(newStatus);
                    if (newStatus == PostStatus::PUBLISHED) {
                        postToUpdate.setPublishedAt(std::chrono::system_clock::now());
                    } else {
                        postToUpdate.setPublishedAt(std::nullopt); // Clear published date if not published
                    }
                    changed = true;
                } else {
                    LOG_WARN("User ID {} (Role {}) attempted to change post status for post ID {}, but is not authorized.",
                             userId, userRoleToString(userRole), id);
                    // Don't error out, just ignore the status change or return 403
                    return callback(createErrorResponse(drogon::k403Forbidden, "Insufficient permissions to change post status."));
                }
            }
        }


        if (changed) {
            postToUpdate.setUpdatedAt(std::chrono::system_clock::now());
            postMapper.update(postToUpdate);
            LOG_INFO("Post ID {} updated by User ID {}", id, userId);
            callback(createPostResponseJson(postToUpdate));
        } else {
            LOG_DEBUG("No changes detected for post ID {} update.", id);
            callback(createSuccessResponse(Json::Value("No changes applied.")));
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during updatePost: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error updating post ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in updatePost endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::deletePost(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for deletePost.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string userId = req->attributes()->get<std::string>("user_id");
    cms::UserRole userRole = req->attributes()->get<cms::UserRole>("user_role");

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        auto postOpt = postMapper.findByPrimaryKey(id);
        if (!postOpt) {
            LOG_WARN("Attempt to delete non-existent post with ID {}.", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::Post postToDelete = *postOpt;

        // Authorization: Only author or Admin/Editor can delete
        if (postToDelete.getAuthorId() != userId &&
            userRole != cms::UserRole::ADMIN &&
            userRole != cms::UserRole::EDITOR) {
            LOG_WARN("User ID {} (Role {}) attempted to delete post ID {} (Author {}), but is not authorized.",
                     userId, userRoleToString(userRole), id, postToDelete.getAuthorId());
            return callback(createErrorResponse(drogon::k403Forbidden, ERR_FORBIDDEN));
        }

        size_t rowsAffected = postMapper.deleteByPrimaryKey(id);
        if (rowsAffected > 0) {
            LOG_INFO("Post ID {} deleted by User ID {}.", id, userId);
            Json::Value responseJson;
            responseJson["message"] = "Post deleted successfully.";
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("Post ID {} not found during delete operation (race condition?).", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error deleting post ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in deletePost endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::publishPost(const drogon::HttpRequestPtr& req,
                                 std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                 std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for publishPost.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string userId = req->attributes()->get<std::string>("user_id");
    // AdminMiddleware ensures Admin role, so we don't need to check userRole explicitly here

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        auto postOpt = postMapper.findByPrimaryKey(id);
        if (!postOpt) {
            LOG_WARN("Attempt to publish non-existent post with ID: {}", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::Post postToUpdate = *postOpt;
        if (postToUpdate.getStatus() == PostStatus::PUBLISHED) {
            LOG_DEBUG("Post ID {} is already published.", id);
            return callback(createSuccessResponse(Json::Value("Post is already published.")));
        }

        postToUpdate.setStatus(PostStatus::PUBLISHED);
        postToUpdate.setPublishedAt(std::chrono::system_clock::now());
        postToUpdate.setUpdatedAt(std::chrono::system_clock::now());
        postMapper.update(postToUpdate);

        LOG_INFO("Post ID {} published by Admin/Editor ID {}.", id, userId);
        callback(createPostResponseJson(postToUpdate));

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error publishing post ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in publishPost endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void PostController::draftPost(const drogon::HttpRequestPtr& req,
                               std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                               std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for draftPost.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    std::string userId = req->attributes()->get<std::string>("user_id");
    // AdminMiddleware ensures Admin role

    drogon::orm::Mapper<drogon_model::cms_system::Post> postMapper(dbClient);
    try {
        auto postOpt = postMapper.findByPrimaryKey(id);
        if (!postOpt) {
            LOG_WARN("Attempt to set non-existent post ID {} to draft status.", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::Post postToUpdate = *postOpt;
        if (postToUpdate.getStatus() == PostStatus::DRAFT) {
            LOG_DEBUG("Post ID {} is already a draft.", id);
            return callback(createSuccessResponse(Json::Value("Post is already a draft.")));
        }

        postToUpdate.setStatus(PostStatus::DRAFT);
        postToUpdate.setPublishedAt(std::nullopt); // Clear published date
        postToUpdate.setUpdatedAt(std::chrono::system_clock::now());
        postMapper.update(postToUpdate);

        LOG_INFO("Post ID {} set to draft by Admin/Editor ID {}.", id, userId);
        callback(createPostResponseJson(postToUpdate));

    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error setting post ID {} to draft: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in draftPost endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

} // namespace cms
```