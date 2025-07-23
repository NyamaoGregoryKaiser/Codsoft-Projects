```cmake
cmake_minimum_required(VERSION 3.10)
project(WebScraper)

add_executable(webscraper main.cpp scraper.cpp database.cpp)

# Add libraries and dependencies here (e.g., for networking, database interaction)
# Example: find_package(Threads REQUIRED)
# ...  add your PostgreSQL and other libraries here based on the system

target_link_libraries(webscraper ${CMAKE_THREAD_LIBS_INIT})
```