```cpp
#ifndef TASK_CONTROLLER_H
#define TASK_CONTROLLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>

class TaskController {
public:
    static void getTasks(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void getTaskById(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void createTask(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void updateTask(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void deleteTask(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    TaskController() = delete; // Prevent instantiation
};

#endif // TASK_CONTROLLER_H
```