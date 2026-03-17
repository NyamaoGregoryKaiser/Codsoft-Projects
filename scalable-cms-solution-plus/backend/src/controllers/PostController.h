#pragma once

#include <drogon/HttpSimpleController.h>
#include <drogon/HttpResponse.h>
#include <json/json.h>
#include "common/Constants.h"

namespace cms {

class PostController : public drogon::HttpSimpleController<PostController> {
public:
    PATH_LIST_BEGIN
    // Public access for viewing published posts (no auth)
    PATH_ADD(POSTS_BASE_PATH, drogon::Get); // All posts (public and private, public only in implementation)
    PATH_ADD(POST_BY_ID_PATH, drogon::Get); // Single post (public only in implementation)

    // Authenticated users (at least USER role) can create/update their own posts
    PATH_ADD(POSTS_BASE_PATH, drogon::Post, "AuthMiddleware");
    PATH_ADD(POST_BY_ID_PATH, drogon::Put, "AuthMiddleware");
    PATH_ADD(POST_BY_ID_PATH, drogon::Delete, "AuthMiddleware");

    // Admin/Editor roles for publishing/drafting posts owned by others
    PATH_ADD(POST_PUBLISH_PATH, drogon::Post, "AuthMiddleware", "AdminMiddleware"); // Or EditorMiddleware
    PATH_ADD(POST_DRAFT_PATH, drogon::Post, "AuthMiddleware", "AdminMiddleware");   // Or EditorMiddleware
    PATH_LIST_END

    // POST /api/v1/posts
    void createPost(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // GET /api/v1/posts (Only published posts for public access, all for authenticated)
    void getAllPosts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // GET /api/v1/posts/{id} (Only published posts for public access, all for authenticated)
    void getPostById(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     std::string id);

    // PUT /api/v1/posts/{id}
    void updatePost(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    std::string id);

    // DELETE /api/v1/posts/{id}
    void deletePost(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    std::string id);

    // POST /api/v1/posts/{id}/publish
    void publishPost(const drogon::HttpRequestPtr& req,
                     std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                     std::string id);

    // POST /api/v1/posts/{id}/draft
    void draftPost(const drogon::HttpRequestPtr& req,
                    std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                    std::string id);

private:
    drogon::HttpResponsePtr createErrorResponse(drogon::HttpStatusCode code, const std::string& message);
    drogon::HttpResponsePtr createSuccessResponse(const Json::Value& data);
    drogon::HttpResponsePtr createPostResponseJson(const drogon_model::cms_system::Post& post);
};

} // namespace cms
```