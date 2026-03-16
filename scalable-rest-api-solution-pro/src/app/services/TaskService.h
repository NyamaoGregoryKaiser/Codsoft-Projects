```cpp
#ifndef TASK_SERVICE_H
#define TASK_SERVICE_H

#include "core/models/Task.h"
#include <vector>
#include <optional>
#include <string>

class TaskService {
public:
    static std::vector<Task> getAllTasks(long long user_id); // Get tasks assigned to/relevant for user
    static std::optional<Task> getTaskById(long long task_id, long long user_id); // User must be assigned or project owner
    static Task createTask(const Task& task, long long current_user_id);
    static std::optional<Task> updateTask(long long task_id, const Task& updated_task, long long current_user_id);
    static bool deleteTask(long long task_id, long long current_user_id);

private:
    TaskService() = delete; // Prevent instantiation
};

#endif // TASK_SERVICE_H
```