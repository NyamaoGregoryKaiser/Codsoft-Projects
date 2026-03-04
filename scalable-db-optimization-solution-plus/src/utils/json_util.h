```cpp
#ifndef OPTIDB_JSON_UTIL_H
#define OPTIDB_JSON_UTIL_H

#include <nlohmann/json.hpp>
#include <string>
#include <map>

// Helper to create a simple JSON object from key-value pairs
inline nlohmann::json to_json(const std::map<std::string, std::string>& data) {
    nlohmann::json j;
    for (const auto& pair : data) {
        j[pair.first] = pair.second;
    }
    return j;
}

// Overload for json::wvalue for Crow compatibility if needed (Crow usually handles directly)
// inline crow::json::wvalue to_crow_json(const std::map<std::string, std::string>& data) {
//     crow::json::wvalue j;
//     for (const auto& pair : data) {
//         j[pair.first] = pair.second;
//     }
//     return j;
// }

#endif // OPTIDB_JSON_UTIL_H
```