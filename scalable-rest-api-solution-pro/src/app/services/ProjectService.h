```cpp
#ifndef PROJECT_SERVICE_H
#define PROJECT_SERVICE_H

#include "core/models/Project.h"
#include <vector>
#include <optional>
#include <string>

class ProjectService {
public:
    static std::vector<Project> getAllProjects(long long user_id);
    static std::optional<Project> getProjectById(long long project_id, long long user_id);
    static Project createProject(const Project& project, long long owner_id);
    static std::optional<Project> updateProject(long long project_id, const Project& updated_project, long long user_id);
    static bool deleteProject(long long project_id, long long user_id);

private:
    ProjectService() = delete; // Prevent instantiation
};

#endif // PROJECT_SERVICE_H
```