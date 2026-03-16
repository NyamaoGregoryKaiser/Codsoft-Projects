```cpp
#include "Project.h"

Project::Project(long long id, std::string name, std::string description, long long owner_id, std::string created_at, std::string updated_at)
    : id(id), name(std::move(name)), description(std::move(description)), owner_id(owner_id), created_at(std::move(created_at)), updated_at(std::move(updated_at)) {}

nlohmann::json Project::toJson() const {
    nlohmann::json j;
    if (id) {
        j["id"] = *id;
    }
    j["name"] = name;
    j["description"] = description;
    j["owner_id"] = owner_id;
    j["created_at"] = created_at;
    j["updated_at"] = updated_at;
    return j;
}

Project Project::fromJson(const nlohmann::json& j) {
    Project project;
    project.id = j.contains("id") ? std::optional<long long>(j.at("id").get<long long>()) : std::nullopt;
    project.name = j.at("name").get<std::string>();
    project.description = j.at("description").get<std::string>();
    // owner_id will be set by the service layer, not directly from request body
    return project;
}
```