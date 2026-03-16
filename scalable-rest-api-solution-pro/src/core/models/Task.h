```cpp
#ifndef TASK_H
#define TASK_H

#include <string>
#include <optional>
#include <nlohmann/json.hpp>

enum class TaskStatus {
    OPEN,
    IN_PROGRESS,
    DONE,
    CANCELLED
};

// Helper to convert TaskStatus to string
std::string taskStatusToString(TaskStatus status);
// Helper to convert string to TaskStatus
TaskStatus stringToTaskStatus(const std::string& status_str);

class Task {
public:
    std::optional<long long> id;
    std::string title;
    std::string description;
    long long project_id;
    long long assigned_user_id;
    TaskStatus status;
    std::string due_date; // ISO 8601 string or empty
    std::string created_at;
    std::string updated_at;

    Task() = default;
    Task(long long id, std::string title, std::string description, long long project_id, long long assigned_user_id, TaskStatus status, std::string due_date, std::string created_at, std::string updated_at);

    nlohmann::json toJson() const;
    static Task fromJson(const nlohmann::json& j);

    bool operator==(const Task& other) const {
        return id == other.id && title == other.title && project_id == other.project_id;
    }
};

#endif // TASK_H
```