cmake_minimum_required(VERSION 3.10)
project(performance_monitor)

find_package(Drogon REQUIRED) # Replace with your C++ web framework

add_executable(performance_monitor main.cpp)
target_link_libraries(performance_monitor Drogon::Drogon) # Link to the framework

# Add any other dependencies