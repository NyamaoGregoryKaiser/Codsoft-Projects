```cpp
#pragma once

#include <stdexcept>
#include <string>

namespace ECommerce {
    namespace Exceptions {

        class ApiException : public std::runtime_error {
        public:
            ApiException(const std::string& message, int statusCode = 500)
                : std::runtime_error(message), _statusCode(statusCode) {}

            int getStatusCode() const {
                return _statusCode;
            }

        private:
            int _statusCode;
        };

    }
}
```