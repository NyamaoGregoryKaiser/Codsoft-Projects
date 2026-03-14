#include "User.h"

nlohmann::json User::toJson() const {
    nlohmann::json j;
    if (id_.has_value()) {
        j["id"] = id_.value();
    }
    j["username"] = username_;
    j["role"] = userRoleToString(role_);
    return j;
}