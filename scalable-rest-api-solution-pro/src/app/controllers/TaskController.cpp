```cpp
#include "TaskController.h"
#include "core/utils/Logger.h"
#include "app/services/TaskService.h"
#include <stdexcept>

using namespace Pistache;
using namespace nlohmann;

void TaskController::getTasks(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long user_id = request.getAttribute<long long>("user_id").get();
        std::vector<Task> tasks = TaskService::getAllTasks(user_id);
        json tasks_json = json::array();
        for (const auto& task : tasks) {
            tasks_json.push_back(task.toJson());
        }
        response.send(Http::Code::Ok, tasks_json.dump(), MIME(Application, Json));
    } catch (const std::exception& e) {
        Logger::error("TaskController::getTasks - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void TaskController::getTaskById(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long task_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();

        std::optional<Task> task_opt = TaskService::getTaskById(task_id, user_id);
        if (task_opt) {
            response.send(Http::Code::Ok, task_opt->toJson().dump(), MIME(Application, Json));
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Task not found or you don't have access"}}).dump());
        }
    } catch (const std::exception& e) {
        Logger::error("TaskController::getTaskById - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void TaskController::createTask(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        json request_body = json::parse(request.body());
        Task new_task_data = Task::fromJson(request_body);

        if (new_task_data.title.empty() || new_task_data.project_id <= 0 || new_task_data.assigned_user_id <= 0) {
            response.send(Http::Code::Bad_Request, json({{"message", "Task title, project_id, and assigned_user_id are required"}}).dump());
            return;
        }

        long long user_id = request.getAttribute<long long>("user_id").get();
        Task created_task = TaskService::createTask(new_task_data, user_id);
        response.send(Http::Code::Created, created_task.toJson().dump(), MIME(Application, Json));
    } catch (const json::parse_error& e) {
        Logger::warn("TaskController::createTask - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::out_of_range& e) {
        Logger::warn("TaskController::createTask - Missing JSON field: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Missing required JSON fields (title, project_id, assigned_user_id)"}}).dump());
    } catch (const std::runtime_error& e) {
        Logger::warn("TaskController::createTask - Business logic error: {}", e.what());
        response.send(Http::Code::Forbidden, json({{"message", e.what()}}).dump()); // e.g., permission denied
    } catch (const std::exception& e) {
        Logger::error("TaskController::createTask - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void TaskController::updateTask(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long task_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();
        json request_body = json::parse(request.body());
        
        Task updated_task_data = Task::fromJson(request_body);
        
        std::optional<Task> updated_task_opt = TaskService::updateTask(task_id, updated_task_data, user_id);
        if (updated_task_opt) {
            response.send(Http::Code::Ok, updated_task_opt->toJson().dump(), MIME(Application, Json));
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Task not found or you don't have access to update"}}).dump());
        }
    } catch (const json::parse_error& e) {
        Logger::warn("TaskController::updateTask - Invalid JSON: {}", e.what());
        response.send(Http::Code::Bad_Request, json({{"message", "Invalid JSON body"}}).dump());
    } catch (const std::runtime_error& e) {
        Logger::warn("TaskController::updateTask - Business logic error: {}", e.what());
        response.send(Http::Code::Forbidden, json({{"message", e.what()}}).dump()); // e.g., permission denied
    } catch (const std::exception& e) {
        Logger::error("TaskController::updateTask - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}

void TaskController::deleteTask(const Rest::Request& request, Http::ResponseWriter response) {
    try {
        long long task_id = request.param(":id").as<long long>();
        long long user_id = request.getAttribute<long long>("user_id").get();

        if (TaskService::deleteTask(task_id, user_id)) {
            response.send(Http::Code::No_Content);
        } else {
            response.send(Http::Code::Not_Found, json({{"message", "Task not found"}}).dump());
        }
    } catch (const std::runtime_error& e) {
        Logger::warn("TaskController::deleteTask - Business logic error: {}", e.what());
        response.send(Http::Code::Forbidden, json({{"message", e.what()}}).dump()); // e.g., permission denied
    } catch (const std::exception& e) {
        Logger::error("TaskController::deleteTask - Error: {}", e.what());
        response.send(Http::Code::Internal_Server_Error, json({{"message", e.what()}}).dump());
    }
}
```