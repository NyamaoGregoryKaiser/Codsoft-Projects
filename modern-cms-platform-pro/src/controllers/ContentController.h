#pragma once

#include <drogon/HttpController.h>
#include <drogon/utils/FunctionTraits.h>
#include <json/json.h>

class ContentController : public drogon::HttpController<ContentController> {
public:
    METHOD_LIST_BEGIN
    METHOD_ADD(ContentController::getAllContent, "/api/v1/content", {drogon::Get});
    METHOD_ADD(ContentController::getContentById, "/api/v1/content/{id}", {drogon::Get});
    METHOD_ADD(ContentController::createContent, "/api/v1/content", {drogon::Post});
    METHOD_ADD(ContentController::updateContent, "/api/v1/content/{id}", {drogon::Put});
    METHOD_ADD(ContentController::deleteContent, "/api/v1/content/{id}", {drogon::Delete});
    METHOD_LIST_END

    void getAllContent(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void getContentById(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        const std::string &id);

    void createContent(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void updateContent(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                       const std::string &id);

    void deleteContent(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                       const std::string &id);
};