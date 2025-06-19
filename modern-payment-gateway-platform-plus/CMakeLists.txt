cmake_minimum_required(VERSION 3.10)
project(PaymentProcessor)

add_executable(payment_processor main.cpp)

# Add necessary libraries here (e.g., for database interaction, networking)

# Example:  If using a specific database library
# find_package(SQLite3 REQUIRED)
# target_link_libraries(payment_processor ${SQLite3_LIBRARIES})