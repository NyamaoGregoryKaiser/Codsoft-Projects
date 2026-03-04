```cpp
#ifndef OPTIDB_TARGET_DB_H
#define OPTIDB_TARGET_DB_H

#include "base_model.h"
#include <string>
#include <nlohmann/json.hpp>

enum class TargetDBStatus {
    ACTIVE,
    INACTIVE,
    ERROR
};

// Helper for enum to string conversion
inline std::string target_db_status_to_string(TargetDBStatus status) {
    switch (status) {
        case TargetDBStatus::ACTIVE: return "ACTIVE";
        case TargetDBStatus::INACTIVE: return "INACTIVE";
        case TargetDBStatus::ERROR: return "ERROR";
        default: return "UNKNOWN";
    }
}

// Helper for string to enum conversion
inline TargetDBStatus string_to_target_db_status(const std::string& status_str) {
    if (status_str == "ACTIVE") return TargetDBStatus::ACTIVE;
    if (status_str == "INACTIVE") return TargetDBStatus::INACTIVE;
    if (status_str == "ERROR") return TargetDBStatus::ERROR;
    return TargetDBStatus::ERROR; // Default to error or throw
}

class TargetDB : public BaseModel {
public:
    long user_id;
    std::string name;
    std::string host;
    std::string port;
    std::string db_name;
    std::string db_user;
    std::string db_password_enc; // Encrypted password or stored securely
    TargetDBStatus status;
    std::string last_error;

    TargetDB() = default;
    TargetDB(long id, long user_id, const std::string& name, const std::string& host, const std::string& port,
             const std::string& db_name, const std::string& db_user, const std::string& db_password_enc,
             TargetDBStatus status, const std::string& last_error,
             std::chrono::system_clock::time_point created_at, std::chrono::system_clock::time_point updated_at)
        : user_id(user_id), name(name), host(host), port(port), db_name(db_name), db_user(db_user),
          db_password_enc(db_password_enc), status(status), last_error(last_error) {
        this->id = id;
        this->created_at = created_at;
        this->updated_at = updated_at;
    }

    nlohmann::json to_json() const override {
        nlohmann::json j;
        j["id"] = id;
        j["user_id"] = user_id;
        j["name"] = name;
        j["host"] = host;
        j["port"] = port;
        j["db_name"] = db_name;
        j["db_user"] = db_user;
        j["status"] = target_db_status_to_string(status);
        j["last_error"] = last_error;
        j["created_at"] = to_iso8601(created_at);
        j["updated_at"] = to_iso8601(updated_at);
        // Do not include db_password_enc in JSON output
        return j;
    }
};

#endif // OPTIDB_TARGET_DB_H
```