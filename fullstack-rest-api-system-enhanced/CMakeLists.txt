cmake_minimum_required(VERSION 3.10)
project(MyAPI)

add_executable(myapi main.cpp database.cpp api.cpp)

# Add libraries as needed (e.g., SQLite, HTTP library)
# find_package(SQLite REQUIRED)
# target_link_libraries(myapi SQLite::SQLite)