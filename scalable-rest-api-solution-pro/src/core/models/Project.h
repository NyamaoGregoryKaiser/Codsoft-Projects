```cpp
#ifndef PROJECT_H
#define PROJECT_H

#include <string>
#include <optional>
#include <nlohmann/json.hpp>

class Project {
public:
    std::optional<long long> id;
    std::string name;
    std::string description;
    long long owner_id;
    std::string created_at;
    std::string updated_at;

    Project() = default;
    Project(long long id, std::string name, std::string description, long long owner_id, std::string created_at, std::string updated_at);

    nlohmann::json toJson() const;
    static Project fromJson(const nlohmann::json& j);

    bool operator==(const Project& other) const {
        return id == other.id && name == other.name && description == other.description && owner_id == other.owner_id;
    }
};

#endif // PROJECT_H
```