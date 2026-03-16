```cpp
#ifndef PROJECT_CONTROLLER_H
#define PROJECT_CONTROLLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>

class ProjectController {
public:
    static void getProjects(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void getProjectById(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void createProject(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void updateProject(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);
    static void deleteProject(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response);

private:
    ProjectController() = delete; // Prevent instantiation
};

#endif // PROJECT_CONTROLLER_H
```