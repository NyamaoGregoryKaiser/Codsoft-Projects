```cpp
#pragma once

#include <drogon/HttpFilter.h>
#include "utils/JwtManager.h"
#include "exceptions/ApiException.h"
#include <memory>

using namespace drogon;

namespace ECommerce {
    namespace Middleware {

        class AuthMiddleware : public HttpFilter<AuthMiddleware> {
        public:
            AuthMiddleware();

            // filter_callback is called before the controller's handler
            void doFilter(const HttpRequestPtr& req,
                          FilterCallback&& fcbl,
                          FilterChainCallback&& fccbl);

            // This method is used to define which endpoints this filter applies to.
            // In main.cc, we would specify it explicitly.
            // Example: METHOD_ADD(SomeController::someMethod, "/path", Get, "AuthMiddleware");
        private:
            std::shared_ptr<Utils::JwtManager> _jwtManager;
        };

    }
}
```