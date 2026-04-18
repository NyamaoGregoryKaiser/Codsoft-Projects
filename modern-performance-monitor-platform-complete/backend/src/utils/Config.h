```cpp
#ifndef PERFOMETRICS_CONFIG_H
#define PERFOMETRICS_CONFIG_H

#include <string>
#include <map>
#include <stdexcept>

class Config {
public:
    static void load(const std::string& filename = ".env");
    static std::string get(const std::string& key);
    static int get_int(const std::string& key);

private:
    static std::map<std::string, std::string> settings;
    static bool loaded;
};

#endif //PERFOMETRICS_CONFIG_H
```