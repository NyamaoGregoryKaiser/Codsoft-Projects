cmake_minimum_required(VERSION 3.10)
project(DataVizProServer CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Dependencies (install these via system package manager or vcpkg)
# For Debian/Ubuntu: sudo apt install libcrow-dev libpqxx-dev libjsoncpp-dev libspdlog-dev libssl-dev
find_package(Crow REQUIRED)
find_package(Pqxx REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED) # Assumes nlohmann/json installed via vcpkg or system
find_package(spdlog CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)

# Source files
set(SERVER_SOURCES
    src/main.cpp
    src/config/AppConfig.h
    src/auth/AuthManager.cpp
    src/auth/AuthManager.h
    src/middleware/AuthMiddleware.h
    src/middleware/ErrorMiddleware.h
    src/db/DBManager.cpp
    src/db/DBManager.h
    src/db/SQLQueries.h
    src/handlers/UserHandler.cpp
    src/handlers/UserHandler.h
    src/handlers/DatasetHandler.cpp
    src/handlers/DatasetHandler.h
    src/handlers/DashboardHandler.cpp
    src/handlers/DashboardHandler.h
    src/services/DatasetService.cpp
    src/services/DatasetService.h
    src/services/DataProcessingService.h
    src/models/User.h
    src/models/Dataset.h
    src/models/Dashboard.h
    src/utils/Logger.h
    src/utils/Cache.h
    src/utils/RateLimiter.h
    src/utils/JWTUtils.h
    src/common/Error.h
    src/common/Constants.h
)

add_executable(dataviz_server ${SERVER_SOURCES})

target_include_directories(dataviz_server PUBLIC
    ${CMAKE_SOURCE_DIR}/src
    ${Crow_INCLUDE_DIRS}
)

target_link_libraries(dataviz_server
    Crow::Crow
    Pqxx::pqxx
    nlohmann_json::nlohmann_json
    spdlog::spdlog
    ${OpenSSL_LIBRARIES}
)

# Build tests
add_subdirectory(tests)
```