```cpp
#ifndef DATABASE_H
#define DATABASE_H

#include <vector>
#include <string>
#include <map>

struct Task {
    int id;
    std::string description;
    bool completed;
};

class Database {
public:
    Database();
    void connect(); // Placeholder for database connection
    std::vector<Task> getTasks();
    void addTask(const Task& task);
    void updateTask(int id, const Task& task);
    void deleteTask(int id);
    
private:
    std::map<int, Task> tasks;
    int next_id;
};

#endif
```