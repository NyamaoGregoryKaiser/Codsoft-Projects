cmake_minimum_required(VERSION 3.10)
project(ProductManagementSystem CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Fetch CrowCpp
# Recommended way to get Crow: using FetchContent or including as submodule
# For simplicity in this example, assuming Crow is locally available or downloaded.
# In a real project, use FetchContent or add as a submodule.
# Example with FetchContent (uncomment and adjust if using):
# include(FetchContent)
# FetchContent_Declare(
#   Crow
#   GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
#   GIT_TAG        master # Or a specific tag/commit
# )
# FetchContent_MakeAvailable(Crow)
# If Crow is just header-only and available, no explicit target needed, just include path.
# For this example, we'll simulate it by assuming include path is set or files are present.
# For a real project, ensure Crow headers are findable.
# Here we'll add a dummy include directory to satisfy `target_include_directories` if Crow is not found via FetchContent.
# In a real setup, this would be your Crow library path.
# We'll just assume Crow's headers are implicitly available via system paths or the build environment.

# Fetch pqxx
# Similar to Crow, you'd fetch or find pqxx.
find_package(PkgConfig REQUIRED)
pkg_check_modules(libpqxx REQUIRED libpqxx) # Requires libpqxx-dev / libpqxx-devel package installed

# Fetch nlohmann/json
# For simplicity, we assume it's a header-only library available via a system include path
# or within the project structure (e.g., in `app/include/`).
# For a real project, use FetchContent or vcpkg/conan.
# include(FetchContent)
# FetchContent_Declare(
#   json
#   GIT_REPOSITORY https://github.com/nlohmann/json.git
#   GIT_TAG        v3.11.2 # Or latest stable
# )
# FetchContent_MakeAvailable(json)

# Source files
file(GLOB_RECURSE APP_SOURCES "src/*.cpp")
file(GLOB_RECURSE APP_HEADERS "src/*.h")

add_executable(${PROJECT_NAME} ${APP_SOURCES} ${APP_HEADERS})

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src            # Project's own headers
    ${libpqxx_INCLUDE_DIRS}
    # Add path to Crow and nlohmann/json if not handled by FetchContent or system includes
    # e.g., ${CMAKE_CURRENT_SOURCE_DIR}/path/to/crow/include
    # e.g., ${CMAKE_CURRENT_SOURCE_DIR}/path/to/nlohmann/json/include
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    ${libpqxx_LIBRARIES}
    ${CMAKE_DL_LIBS} # For dynamic linking dependencies on some systems
)

# Build and run tests
add_subdirectory(tests)