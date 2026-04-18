```cpp
#ifndef PERFOMETRICS_SERVICE_H
#define PERFOMETRICS_SERVICE_H

#include <string>
#include <optional>
#include <vector>

struct Service {
    int id;
    std::string name;
    std::string description;
    std::string api_key; // Unique key for services to send metrics

    Service() : id(0) {} // Default constructor

    Service(int id, std::string name, std::string description, std::string api_key)
        : id(id), name(std::move(name)), description(std::move(description)), api_key(std::move(api_key)) {}
};

#endif //PERFOMETRICS_SERVICE_H
```