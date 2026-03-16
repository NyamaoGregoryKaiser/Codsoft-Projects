```cpp
#include "Task.h"
#include <stdexcept>

std::string taskStatusToString(TaskStatus status) {
    switch (status) {
        case TaskStatus::OPEN: return "OPEN";
        case TaskStatus::IN_PROGRESS: return "IN_PROGRESS";
        case TaskStatus::DONE: return "DONE";
        case TaskStatus::CANCELLED: return "CANCELLED";
        default: return "UNKNOWN"; // Should not happen
    }
}

TaskStatus stringToTaskStatus(const std::string& status_str) {
    if (status_str == "OPEN") return TaskStatus::OPEN;
    if (status_str == "IN_PROGRESS") return TaskStatus::IN_PROGRESS;
    if (status_str == "DONE") return TaskStatus::DONE;
    if (status_str == "CANCELLED") return TaskStatus::CANCELLED;
    throw std::runtime_error("Invalid task status string: " + status_str);
}

Task::Task(long long id, std::string title, std::string description, long long project_id, long long assigned_user_id, TaskStatus status, std::string due_date, std::string created_at, std::string updated_at)
    : id(id), title(std::move(title)), description(std::move(description)), project_id(project_id), assigned_user_id(assigned_user_id), status(status), due_date(std::move(due_date)), created_at(std::move(created_at)), updated_at(std::move(updated_at)) {}

nlohmann::json Task::toJson() const {
    nlohmann::json j;
    if (id) {
        j["id"] = *id;
    }
    j["title"] = title;
    j["description"] = description;
    j["project_id"] = project_id;
    j["assigned_user_id"] = assigned_user_id;
    j["status"] = taskStatusToString(status);
    j["due_date"] = due_date;
    j["created_at"] = created_at;
    j["updated_at"] = updated_at;
    return j;
}

Task Task::fromJson(const nlohmann::json& j) {
    Task task;
    task.id = j.contains("id") ? std::optional<long long>(j.at("id").get<long long>()) : std::nullopt;
    task.title = j.at("title").get<std::string>();
    task.description = j.at("description").get<std::string>();
    task.project_id = j.at("project_id").get<long long>();
    task.assigned_user_id = j.at("assigned_user_id").get<long long>();
    
    std::string status_str = j.value("status", "OPEN"); // Default to OPEN if not provided
    task.status = stringToTaskStatus(status_str);

    task.due_date = j.value("due_date", ""); // Optional field
    return task;
}
```