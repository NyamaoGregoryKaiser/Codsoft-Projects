```cpp
#include "TaskService.h"
#include "core/database/DatabaseManager.h"
#include "core/models/Project.h" // To check project ownership
#include "core/utils/Logger.h"
#include <chrono>
#include <iomanip>
#include <sstream>
#include <stdexcept>

// Helper to check if a user has access to a task (either assigned or project owner)
namespace {
    bool hasTaskAccess(long long task_id, long long user_id) {
        soci::session& sql = DatabaseManager::getSession();
        int count = 0;
        try {
            sql << "SELECT COUNT(T.id) FROM tasks T JOIN projects P ON T.project_id = P.id WHERE T.id = :task_id AND (T.assigned_user_id = :user_id OR P.owner_id = :user_id)",
                soci::into(count), soci::use(task_id), soci::use(user_id);
            return count > 0;
        } catch (const soci::soci_error& e) {
            Logger::error("Database error checking task access for task {} by user {}: {}", task_id, user_id, e.what());
            throw std::runtime_error("Database error checking task access.");
        }
    }

    bool isProjectOwner(long long project_id, long long user_id) {
        soci::session& sql = DatabaseManager::getSession();
        int count = 0;
        try {
            sql << "SELECT COUNT(id) FROM projects WHERE id = :project_id AND owner_id = :user_id",
                soci::into(count), soci::use(project_id), soci::use(user_id);
            return count > 0;
        } catch (const soci::soci_error& e) {
            Logger::error("Database error checking project ownership for project {} by user {}: {}", project_id, user_id, e.what());
            throw std::runtime_error("Database error checking project ownership.");
        }
    }
}

std::vector<Task> TaskService::getAllTasks(long long user_id) {
    soci::session& sql = DatabaseManager::getSession();
    std::vector<Task> tasks;

    try {
        soci::statement st = (sql.prepare <<
            "SELECT T.id, T.title, T.description, T.project_id, T.assigned_user_id, T.status, T.due_date, T.created_at, T.updated_at "
            "FROM tasks T JOIN projects P ON T.project_id = P.id "
            "WHERE T.assigned_user_id = :user_id OR P.owner_id = :user_id",
            soci::use(user_id));

        st.execute();

        long long id, project_id, assigned_user_id;
        std::string title, description, status_str, due_date, created_at, updated_at;

        while (st.fetch()) {
            tasks.emplace_back(id, title, description, project_id, assigned_user_id,
                               stringToTaskStatus(status_str), due_date, created_at, updated_at);
        }
        Logger::info("Fetched {} tasks for user_id: {}", tasks.size(), user_id);
        return tasks;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error fetching all tasks for user_id {}: {}", user_id, e.what());
        throw std::runtime_error("Failed to fetch tasks. Database error.");
    }
}

std::optional<Task> TaskService::getTaskById(long long task_id, long long user_id) {
    soci::session& sql = DatabaseManager::getSession();
    Task task;
    long long id_val, project_id_val, assigned_user_id_val;
    std::string title_val, description_val, status_str_val, due_date_val, created_at_val, updated_at_val;

    try {
        sql << "SELECT id, title, description, project_id, assigned_user_id, status, due_date, created_at, updated_at FROM tasks WHERE id = :id",
            soci::into(id_val), soci::into(title_val), soci::into(description_val), soci::into(project_id_val),
            soci::into(assigned_user_id_val), soci::into(status_str_val), soci::into(due_date_val),
            soci::into(created_at_val), soci::into(updated_at_val),
            soci::use(task_id);

        if (!hasTaskAccess(id_val, user_id)) {
            Logger::warn("User {} tried to access task {} without permission.", user_id, task_id);
            return std::nullopt;
        }

        task.id = id_val;
        task.title = title_val;
        task.description = description_val;
        task.project_id = project_id_val;
        task.assigned_user_id = assigned_user_id_val;
        task.status = stringToTaskStatus(status_str_val);
        task.due_date = due_date_val;
        task.created_at = created_at_val;
        task.updated_at = updated_at_val;

        Logger::info("Fetched task with ID {} for user_id: {}", task_id, user_id);
        return task;
    } catch (const soci::soci_error& e) {
        if (e.get_error_code() == soci::sqlite3 && std::string(e.what()).find("No data fetched") != std::string::npos) {
            Logger::warn("Task not found with ID {}.", task_id);
            return std::nullopt;
        }
        Logger::error("Database error fetching task by ID {}: {}", task_id, e.what());
        throw std::runtime_error("Failed to fetch task. Database error.");
    }
}

Task TaskService::createTask(const Task& task, long long current_user_id) {
    soci::session& sql = DatabaseManager::getSession();
    Task new_task = task; // Copy to modify

    // Ensure the current user has access to the project
    if (!isProjectOwner(new_task.project_id, current_user_id)) {
        throw std::runtime_error("Permission denied: You do not own the project to create a task in it.");
    }
    
    // Ensure assigned user exists (optional, could be added later)
    // For now, just make sure `assigned_user_id` is not 0 or invalid, could be `current_user_id`
    if (new_task.assigned_user_id <= 0) {
        new_task.assigned_user_id = current_user_id; // Default to creator
    }

    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&tt), "%Y-%m-%dT%H:%M:%SZ");
    new_task.created_at = ss.str();
    new_task.updated_at = ss.str();

    try {
        long long new_task_id;
        std::string status_str = taskStatusToString(new_task.status);
        sql << "INSERT INTO tasks (title, description, project_id, assigned_user_id, status, due_date, created_at, updated_at) VALUES (:title, :description, :project_id, :assigned_user_id, :status, :due_date, :created_at, :updated_at) RETURNING id",
            soci::use(new_task.title), soci::use(new_task.description), soci::use(new_task.project_id),
            soci::use(new_task.assigned_user_id), soci::use(status_str), soci::use(new_task.due_date),
            soci::use(new_task.created_at), soci::use(new_task.updated_at),
            soci::into(new_task_id);
        new_task.id = new_task_id;
        Logger::info("Created task with ID {} for project_id: {}", *new_task.id, new_task.project_id);
        return new_task;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error creating task for project_id {}: {}", new_task.project_id, e.what());
        throw std::runtime_error("Failed to create task. Database error.");
    }
}

std::optional<Task> TaskService::updateTask(long long task_id, const Task& updated_task, long long current_user_id) {
    soci::session& sql = DatabaseManager::getSession();

    // Check if the user has access to modify this task
    // Only project owner can modify project_id or assigned_user_id
    // Assigned user can update title, description, status, due_date
    auto existing_task_opt = getTaskById(task_id, current_user_id);
    if (!existing_task_opt) {
        return std::nullopt; // Task not found or user doesn't have access
    }

    Task existing_task = *existing_task_opt;
    bool is_owner = isProjectOwner(existing_task.project_id, current_user_id);
    bool is_assigned = (existing_task.assigned_user_id == current_user_id);

    // Apply updates based on roles
    if (!updated_task.title.empty()) {
        existing_task.title = updated_task.title;
    }
    if (!updated_task.description.empty()) {
        existing_task.description = updated_task.description;
    }
    if (updated_task.status != TaskStatus::OPEN) { // Default is OPEN, so only update if explicitly changed
        existing_task.status = updated_task.status;
    }
    if (!updated_task.due_date.empty()) {
        existing_task.due_date = updated_task.due_date;
    }

    // Only project owner can change project_id or reassign
    if (is_owner) {
        if (updated_task.project_id > 0 && updated_task.project_id != existing_task.project_id) {
            // Check if the new project also belongs to the owner
            if (!isProjectOwner(updated_task.project_id, current_user_id)) {
                 throw std::runtime_error("Permission denied: You do not own the target project for task transfer.");
            }
            existing_task.project_id = updated_task.project_id;
        }
        if (updated_task.assigned_user_id > 0 && updated_task.assigned_user_id != existing_task.assigned_user_id) {
            existing_task.assigned_user_id = updated_task.assigned_user_id;
        }
    } else if (updated_task.project_id > 0 && updated_task.project_id != existing_task.project_id) {
        throw std::runtime_error("Permission denied: Only project owner can reassign task to a different project.");
    } else if (updated_task.assigned_user_id > 0 && updated_task.assigned_user_id != existing_task.assigned_user_id) {
        throw std::runtime_error("Permission denied: Only project owner can reassign task to a different user.");
    }

    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&tt), "%Y-%m-%dT%H:%M:%SZ");
    existing_task.updated_at = ss.str();

    try {
        int rows_affected = 0;
        std::string status_str = taskStatusToString(existing_task.status);
        sql << "UPDATE tasks SET title = :title, description = :description, project_id = :project_id, assigned_user_id = :assigned_user_id, status = :status, due_date = :due_date, updated_at = :updated_at WHERE id = :id",
            soci::use(existing_task.title), soci::use(existing_task.description), soci::use(existing_task.project_id),
            soci::use(existing_task.assigned_user_id), soci::use(status_str), soci::use(existing_task.due_date),
            soci::use(existing_task.updated_at), soci::use(task_id),
            soci::into(rows_affected);

        if (rows_affected == 0) {
            Logger::warn("Update task {} failed: No rows affected. Task might not exist.", task_id);
            return std::nullopt; // Should ideally not happen after the initial `getTaskById` check
        }

        Logger::info("Updated task with ID {} for project_id: {}", task_id, existing_task.project_id);
        existing_task.id = task_id;
        return existing_task;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error updating task {}: {}", task_id, e.what());
        throw std::runtime_error("Failed to update task. Database error.");
    }
}

bool TaskService::deleteTask(long long task_id, long long current_user_id) {
    soci::session& sql = DatabaseManager::getSession();

    // Check if the user has access to delete this task (must be project owner)
    auto existing_task_opt = getTaskById(task_id, current_user_id); // This also verifies general access
    if (!existing_task_opt) {
        return false; // Task not found or user doesn't have access (either assigned or owner)
    }

    // Explicitly check if current_user is the project owner for deletion
    if (!isProjectOwner(existing_task_opt->project_id, current_user_id)) {
        Logger::warn("User {} tried to delete task {} without project owner permission.", current_user_id, task_id);
        throw std::runtime_error("Permission denied: Only the project owner can delete tasks.");
    }

    try {
        int rows_affected = 0;
        sql << "DELETE FROM tasks WHERE id = :id",
            soci::use(task_id),
            soci::into(rows_affected);

        if (rows_affected > 0) {
            Logger::info("Deleted task with ID {} by user_id: {}", task_id, current_user_id);
            return true;
        } else {
            Logger::warn("Delete task {} failed: No rows affected. Task might not exist.", task_id);
            return false;
        }
    } catch (const soci::soci_error& e) {
        Logger::error("Database error deleting task {}: {}", task_id, e.what());
        throw std::runtime_error("Failed to delete task. Database error.");
    }
}
```