#include "CategoryController.h"
#include "utils/Logger.h"
#include "database/DbClientManager.h"
#include "common/Constants.h"
#include "common/Enums.h"

#include <drogon/orm/Mapper.h>
#include <drogon/orm/Criteria.h>
#include <drogon/orm/Exception.h>
#include "models/Category.h" // Generated Category model

namespace cms {

drogon::HttpResponsePtr CategoryController::createErrorResponse(drogon::HttpStatusCode code, const std::string& message) {
    Json::Value json;
    json["error"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
    resp->setStatusCode(code);
    return resp;
}

drogon::HttpResponsePtr CategoryController::createSuccessResponse(const Json::Value& data) {
    auto resp = drogon::HttpResponse::newHttpJsonResponse(data);
    resp->setStatusCode(drogon::k200OK);
    return resp;
}

drogon::HttpResponsePtr CategoryController::createCategoryResponseJson(const drogon_model::cms_system::Category& category) {
    Json::Value categoryJson;
    categoryJson["id"] = category.getId();
    categoryJson["name"] = category.getName();
    categoryJson["slug"] = category.getSlug();
    categoryJson["description"] = category.getDescription().value_or(""); // Optional field
    categoryJson["createdAt"] = drogon::utils::get<std::string>(category.getCreatedAt());
    categoryJson["updatedAt"] = drogon::utils::get<std::string>(category.getUpdatedAt());
    return createSuccessResponse(categoryJson);
}

void CategoryController::createCategory(const drogon::HttpRequestPtr& req,
                                        std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for createCategory.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    try {
        auto json = req->getJsonObject();
        if (!json || !json->isMember("name")) {
            LOG_WARN("Bad request for createCategory: Missing name.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        std::string name = (*json)["name"].asString();
        if (name.empty()) {
            LOG_WARN("Bad request for createCategory: Empty name.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        drogon_model::cms_system::Category newCategory;
        newCategory.setName(name);
        newCategory.setSlug(drogon::utils::generateUuid()); // Simple slug for now, better to slugify name
        if (json->isMember("description") && (*json)["description"].isString()) {
            newCategory.setDescription((*json)["description"].asString());
        }
        
        // Check for duplicate name/slug (simple check)
        auto existing = drogon::orm::Mapper<drogon_model::cms_system::Category>(dbClient)
                            .findBy(drogon::orm::Criteria("name", drogon::orm::CompareOperator::EQ, name));
        if (!existing.empty()) {
            LOG_WARN("Category creation failed: name '{}' already exists.", name);
            return callback(createErrorResponse(drogon::k409Conflict, "Category with this name already exists."));
        }

        drogon_model::cms_system::Category createdCategory = drogon::orm::Mapper<drogon_model::cms_system::Category>(dbClient).insertAndGetId(newCategory);
        LOG_INFO("Category '{}' created by User ID {}", createdCategory.getName(), req->attributes()->get<std::string>("user_id"));
        callback(createCategoryResponseJson(createdCategory));

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during createCategory: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error during createCategory: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in createCategory endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void CategoryController::getAllCategories(const drogon::HttpRequestPtr& req,
                                          std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getAllCategories.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
    try {
        auto categories = categoryMapper.findAll();
        Json::Value categoriesArray;
        for (const auto& category : categories) {
            Json::Value categoryJson;
            categoryJson["id"] = category.getId();
            categoryJson["name"] = category.getName();
            categoryJson["slug"] = category.getSlug();
            categoryJson["description"] = category.getDescription().value_or("");
            categoryJson["createdAt"] = drogon::utils::get<std::string>(category.getCreatedAt());
            categoryJson["updatedAt"] = drogon::utils::get<std::string>(category.getUpdatedAt());
            categoriesArray.append(categoryJson);
        }
        callback(createSuccessResponse(categoriesArray));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching all categories: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getAllCategories endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void CategoryController::getCategoryById(const drogon::HttpRequestPtr& req,
                                         std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                         std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for getCategoryById.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
    try {
        auto category = categoryMapper.findByPrimaryKey(id);
        if (category) {
            callback(createCategoryResponseJson(*category));
        } else {
            LOG_WARN("Category with ID {} not found.", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error fetching category by ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in getCategoryById endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void CategoryController::updateCategory(const drogon::HttpRequestPtr& req,
                                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                        std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for updateCategory.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
    try {
        auto categoryOpt = categoryMapper.findByPrimaryKey(id);
        if (!categoryOpt) {
            LOG_WARN("Attempt to update non-existent category with ID: {}", id);
            return callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }

        drogon_model::cms_system::Category categoryToUpdate = *categoryOpt;

        auto json = req->getJsonObject();
        if (!json) {
            LOG_WARN("Bad request for updateCategory: No JSON body provided.");
            return callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
        }

        bool changed = false;
        if (json->isMember("name") && (*json)["name"].isString()) {
            std::string newName = (*json)["name"].asString();
            if (newName != categoryToUpdate.getName()) {
                // Check for duplicate name
                auto existing = categoryMapper.findBy(drogon::orm::Criteria("name", drogon::orm::CompareOperator::EQ, newName));
                if (!existing.empty() && existing[0].getId() != categoryToUpdate.getId()) {
                    LOG_WARN("Attempt to update category name to an already existing name: {}", newName);
                    return callback(createErrorResponse(drogon::k409Conflict, "Category with this name already exists."));
                }
                categoryToUpdate.setName(newName);
                // Also update slug if based on name
                categoryToUpdate.setSlug(drogon::utils::generateUuid()); // Simple slug, would be derived from newName
                changed = true;
            }
        }
        if (json->isMember("description") && (*json)["description"].isString()) {
            std::string newDescription = (*json)["description"].asString();
            if (categoryToUpdate.getDescription().value_or("") != newDescription) {
                categoryToUpdate.setDescription(newDescription);
                changed = true;
            }
        }

        if (changed) {
            categoryToUpdate.setUpdatedAt(std::chrono::system_clock::now());
            categoryMapper.update(categoryToUpdate);
            LOG_INFO("Category ID {} updated by User ID {}", id, req->attributes()->get<std::string>("user_id"));
            callback(createCategoryResponseJson(categoryToUpdate));
        } else {
            LOG_DEBUG("No changes detected for category ID {} update.", id);
            callback(createSuccessResponse(Json::Value("No changes applied.")));
        }

    } catch (const Json::Exception& e) {
        LOG_ERROR("JSON parsing error during updateCategory: {}", e.what());
        callback(createErrorResponse(drogon::k400BadRequest, ERR_BAD_REQUEST));
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error updating category ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in updateCategory endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

void CategoryController::deleteCategory(const drogon::HttpRequestPtr& req,
                                        std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                                        std::string id) {
    auto dbClient = DbClientManager::instance().getDbClient();
    if (!dbClient) {
        LOG_CRITICAL("Database client unavailable for deleteCategory.");
        return callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }

    drogon::orm::Mapper<drogon_model::cms_system::Category> categoryMapper(dbClient);
    try {
        size_t rowsAffected = categoryMapper.deleteByPrimaryKey(id);
        if (rowsAffected > 0) {
            LOG_INFO("Category ID {} deleted by User ID {}", id, req->attributes()->get<std::string>("user_id"));
            Json::Value responseJson;
            responseJson["message"] = "Category deleted successfully.";
            callback(createSuccessResponse(responseJson));
        } else {
            LOG_WARN("Attempt to delete non-existent category with ID {}.", id);
            callback(createErrorResponse(drogon::k404NotFound, ERR_NOT_FOUND));
        }
    } catch (const drogon::orm::DrogonDbException& e) {
        LOG_ERROR("Database error deleting category ID {}: {}", id, e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    } catch (const std::exception& e) {
        LOG_CRITICAL("Unhandled exception in deleteCategory endpoint: {}", e.what());
        callback(createErrorResponse(drogon::k500InternalServerError, ERR_SERVER_ERROR));
    }
}

} // namespace cms
```