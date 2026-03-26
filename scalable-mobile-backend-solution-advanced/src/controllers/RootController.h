```cpp
#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>

/**
 * @brief Simple root controller for health checks or basic information.
 */
class RootController : public drogon::HttpController<RootController> {
public:
    METHOD_LIST_BEGIN
    // Use METHOD_ADD to add your endpoints
    // Path /api/v1/ will be handled by this controller
    METHOD_ADD(RootController::get, "/", drogon::Get, "RateLimitFilter");
    METHOD_LIST_END

    /**
     * @brief Handles GET requests to the root path.
     * @param req The HTTP request.
     * @param callback The callback to send the response.
     */
    void get(const drogon::HttpRequestPtr& req,
             std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};
```