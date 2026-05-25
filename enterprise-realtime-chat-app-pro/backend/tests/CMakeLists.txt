```cmake
add_executable(chat_backend_tests
    test_user_repository.cpp
    # Add other test files here
)

target_link_libraries(chat_backend_tests
    gtest_main
    gtest
    # Link to your application's libraries if testing internal components
    # (e.g., if you have shared libraries or need access to internal functions)
    chat_backend # Link the main application for direct access to code
)

# Set up test discovery for CTest
include(GoogleTest)
gtest_discover_tests(chat_backend_tests)
```