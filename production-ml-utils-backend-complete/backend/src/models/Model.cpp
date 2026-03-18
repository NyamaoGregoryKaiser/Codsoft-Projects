#include "Model.h"

nlohmann::json Model::toJson() const {
    nlohmann::json j;
    j["id"] = id;
    j["user_id"] = user_id;
    j["name"] = name;
    j["description"] = description;
    j["version"] = version;
    j["model_path"] = model_path;
    j["status"] = status;
    j["metadata"] = metadata;
    j["created_at"] = created_at;
    j["updated_at"] = updated_at;
    return j;
}

Model Model::fromJson(const nlohmann::json& json) {
    Model model;
    model.id = json.value("id", UUID::generate_uuid_v4());
    model.user_id = json.at("user_id").get<std::string>();
    model.name = json.at("name").get<std::string>();
    model.description = json.value("description", "");
    model.version = json.value("version", "1.0.0");
    model.model_path = json.value("model_path", "");
    model.status = json.value("status", "draft");
    model.metadata = json.value("metadata", nlohmann::json::object());
    model.created_at = json.value("created_at", "");
    model.updated_at = json.value("updated_at", "");
    return model;
}
```