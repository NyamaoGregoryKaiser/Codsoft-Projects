```cpp
#ifndef ZENITH_ROUTES_HPP
#define ZENITH_ROUTES_HPP

#include <httplib.h>
#include "../services/user_service.hpp"
// Include other services as needed
#include "../database/repositories/user_repository.hpp" // For initializing services

namespace Zenith {
namespace Api {

// Forward declare services for dependency injection
extern Services::UserService* userService; // Global pointer, or better, pass by reference in setupRoutes

void setupRoutes(httplib::Server& svr);

} // namespace Api
} // namespace Zenith

#endif // ZENITH_ROUTES_HPP
```