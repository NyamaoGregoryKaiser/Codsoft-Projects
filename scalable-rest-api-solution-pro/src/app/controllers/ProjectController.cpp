```cpp
#include "ProjectController.h"
#include "core/utils/Logger.h"
#include "core/utils/Config.h" // For getting user_id from request attributes
#include "app/services/ProjectService.h"
#include <stdexcept>
#include <string>

using namespace Pistache;
using namespace nlohmann;

void ProjectController::getProjects(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long user_id = request.getAttribute<long long>("user_id").get(); // Extracted by AuthMiddleware
        std::vector<Project> projects = ProjectService::getAllProjects(user_id);
        json projects_json = json::array();
        for (const auto& project : projects) {
            projects_json.push_back(project.toJson());
        }
        response.send(Http::Code::Ok, projects_json.dump(), MIME(Application, Json));
    } catch (const std::exception& e) {
        Logger::error("ProjectController::getProjects - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void ProjectController::getProjectById(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long project_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();

        std::optional<Project> project_opt = ProjectService::getProjectById(project_id, user_id);
        if (project_opt) {
            response.send(Http::Code::Ok, project_opt->toJson().dump(), MIME(Application, Json));
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Project not found or you don't have access"}}).dump());
        }
    } catch (const std::exception& e) {
        Logger::error("ProjectController::getProjectById - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void ProjectController::createProject(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        json request_body = json::parse(request.body());
        Project new_project = Project::fromJson(request_body);
        
        if (new_project.name.empty() || new_project.description.empty()) {
            response.send(Http::Code::Bad_Request, json({{"message", "Project name and description are required"}}).dump());
            return;
        }

        long long user_id = request.getAttribute<long long>("user_id").get();
        new_project = ProjectService::createProject(new_project, user_id);
        response.send(Http::Code::Created, new_project.toJson().dump(), MIME(Application, Json));
    } catch (const json::parse_error& e) {
        Logger::warn("ProjectController::createProject - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::out_of_range& e) {
        Logger::warn("ProjectController::createProject - Missing JSON field: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Missing required JSON fields (name, description)"}}).dump());
    } catch (const std::exception& e) {
        Logger::error("ProjectController::createProject - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void ProjectController::updateProject(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long project_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();
        json request_body = json::parse(request.body());
        
        Project updated_project_data = Project::fromJson(request_body);
        
        std::optional<Project> updated_project_opt = ProjectService::updateProject(project_id, updated_project_data, user_id);
        if (updated_project_opt) {
            response.send(Http::Code::Ok, updated_project_opt->toJson().dump(), MIME(Application, Json));
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Project not found or you don't have access to update"}}).dump());
        }

    } catch (const json::parse_error& e) {
        Logger::warn("ProjectController::updateProject - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::exception& e) {
        Logger::error("ProjectController::updateProject - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void ProjectController::deleteProject(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long project_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();

        if (ProjectService::deleteProject(project_id, user_id)) {
            response.send(Http::Code::No_Content); // 204 No Content for successful deletion
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Project not found or you don't have access to delete"}}).dump());
        }
    } catch (const std::exception& e) {
        Logger::error("ProjectController::deleteProject - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}
```