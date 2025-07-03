cmake_minimum_required(VERSION 3.10)
project(AuthenticationSystem)

add_executable(auth_server main.cpp)

# Add necessary libraries here (e.g., networking, database connector)
# find_package(OpenSSL REQUIRED)  #Example
# target_link_libraries(auth_server OpenSSL::OpenSSL)