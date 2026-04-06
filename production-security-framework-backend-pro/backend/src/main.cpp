#include "app.h"
#include <iostream>

int main() {
    try {
        SecureApp app;
        app.run();
    } catch (const std::exception& e) {
        std::cerr << "Fatal application error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    } catch (...) {
        std::cerr << "Unknown fatal application error." << std::endl;
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}