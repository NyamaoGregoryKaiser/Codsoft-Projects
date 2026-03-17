#pragma once

#include <drogon/HttpSimpleController.h>
#include <drogon/HttpResponse.h>
#include <json/json.h>
#include "common/Constants.h"

namespace cms {

class CategoryController : public drogon::HttpSimpleController<CategoryController> {
public:
    PATH_LIST_BEGIN
    // All authenticated users can list/view categories
    PATH_ADD(CATEGORIES_BASE_PATH, drogon::Get, "AuthMiddleware");
    PATH_ADD(CATEGORY_BY_ID_PATH, drogon::Get, "AuthMiddleware");

    // Only Admin or Editor can create/update/delete categories
    PATH_ADD(CATEGORIES_BASE_PATH, drogon::Post, "AuthMiddleware", "AdminMiddleware"); // Or EditorMiddleware
    PATH_ADD(CATEGORY_BY_ID_PATH, drogon::Put, "AuthMiddleware", "AdminMiddleware");   // Or EditorMiddleware
    PATH_ADD(CATEGORY_BY_ID_PATH, drogon::Delete, "AuthMiddleware", "AdminMiddleware"); // Or EditorMiddleware
    PATH_LIST_END

    // POST /api/v1/categories
    void createCategory(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // GET /api/v1/categories
    void getAllCategories(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    // GET /api/v1/categories/{id}
    void getCategoryById(const drogon::HttpRequestPtr& req,
                         std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                         std::string id);

    // PUT /api/v1/categories/{id}
    void updateCategory(const drogon::HttpRequestPtr& req,
                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                        std::string id);

    // DELETE /api/v1/categories/{id}
    void deleteCategory(const drogon::HttpRequestPtr& req,
                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                        std::string id);

private:
    drogon::HttpResponsePtr createErrorResponse(drogon::HttpStatusCode code, const std::string& message);
    drogon::HttpResponsePtr createSuccessResponse(const Json::Value& data);
    drogon::HttpResponsePtr createCategoryResponseJson(const drogon_model::cms_system::Category& category);
};

} // namespace cms
```