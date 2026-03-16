```cpp
#ifndef CONFIG_H
#define CONFIG_H

#include <string>
#include <map>
#include <nlohmann/json.hpp>

class Config {
private:
    static nlohmann::json settings;
    Config() = delete; // Prevent instantiation

public:
    static void load(const std::string& filepath);
    static std::string get(const std::string& key, const std::string& default_value = "");
    static int getInt(const std::string& key, int default_value = 0);
    static bool getBool(const std::string& key, bool default_value = false);

    // Optional: Get a nested config object
    static nlohmann::json getObject(const std::string& key);
};

#endif // CONFIG_H
```