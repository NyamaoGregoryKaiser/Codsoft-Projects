```cpp
#include "RootController.h"
#include "../utils/Logger.h"

void RootController::get(const drogon::HttpRequestPtr& req,
                         std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    LOG_INFO("Received GET request to root path.");

    Json::Value resp_json;
    resp_json["message"] = "Mobile Backend is running!";
    resp_json["status"] = "OK";
    resp_json["version"] = "1.0.0"; // Replace with actual version from build if available

    auto resp = drogon::HttpResponse::newHttpJsonResponse(resp_json);
    resp->setStatusCode(drogon::k200OK);
    callback(resp);
}
```