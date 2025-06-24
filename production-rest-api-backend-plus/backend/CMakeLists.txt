```cmake
cmake_minimum_required(VERSION 3.10)
project(TaskAPI_Backend)

add_executable(taskapi main.cpp task_manager.cpp api.cpp database.cpp)
target_link_libraries(taskapi spdlog) #add your libraries here


#Add installation rules
install(TARGETS taskapi DESTINATION bin)
```