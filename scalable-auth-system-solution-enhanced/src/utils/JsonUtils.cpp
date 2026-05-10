```cpp
#include "JsonUtils.h"

crow::response JsonUtils::sendSuccess(crow::response& res, 
                                     const std::string& message, 
                                     const crow::json::wvalue& data, 
                                     int http_status) {
    crow::json::wvalue json_response;
    json_response["status"] = "success";
    json_response["message"] = message;
    if (!data.is_null()) {
        json_response["data"] = data;
    }
    res.code = http_status;
    res.set_header("Content-Type", "application/json");
    res.write(json_response.dump());
    return res;
}

crow::response JsonUtils::sendError(crow::response& res, 
                                   const std::string& error_code, 
                                   const std::string& message, 
                                   int http_status,
                                   const crow::json::wvalue& details) {
    crow::json::wvalue json_response;
    json_response["status"] = "error";
    json_response["code"] = error_code;
    json_response["message"] = message;
    if (!details.is_null()) {
        json_response["details"] = details;
    }
    res.code = http_status;
    res.set_header("Content-Type", "application/json");
    res.write(json_response.dump());
    return res;
}
```