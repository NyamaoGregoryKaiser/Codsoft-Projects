```cpp
#include "database.h"

Database::Database() : next_id(1) {}

void Database::connect() {
    // Replace with your actual database connection logic
    spdlog::info("Connected to in-memory database.");
}

std::vector<Task> Database::getTasks() {
    std::vector<Task> result;
    for (const auto& pair : tasks) {
        result.push_back(pair.second);
    }
    return result;
}

void Database::addTask(const Task& task) {
    tasks[next_id] = task;
    tasks[next_id].id = next_id;
    next_id++;
}

void Database::updateTask(int id, const Task& task) {
    if (tasks.count(id)) {
        tasks[id] = task;
    }
}

void Database::deleteTask(int id) {
    tasks.erase(id);
}
```