```cmake
cmake_minimum_required(VERSION 3.10)
project(DataVisualizationTool)

find_package(Qt5 REQUIRED COMPONENTS Widgets Core Network Sql)

add_executable(DataVisualizationTool main.cpp)
target_link_libraries(DataVisualizationTool Qt5::Widgets Qt5::Core Qt5::Network Qt5::Sql)
```