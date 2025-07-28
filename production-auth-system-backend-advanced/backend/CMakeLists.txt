cmake_minimum_required(VERSION 3.10)
project(AuthenticationSystemBackend)

add_executable(authserver main.cpp database.cpp user.cpp auth.cpp api.cpp)
target_link_libraries(authserver pq) #PostgreSQL library

#Add other necessary libraries