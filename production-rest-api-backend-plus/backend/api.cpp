```cpp
#include "api.h"
#include <spdlog/spdlog.h>


//Implementation using cpprestsdk
using namespace web;
using namespace web::http;
using namespace web::http::experimental::listener;
using namespace concurrency::streams;

API::API(Database& db) : db(db),listen_address(U("http://*:8080/")) {
    listener = http_listener(listen_address);
    listener.support(methods::GET, std::bind(&API::handle_get, this, std::placeholders::_1));
    listener.support(methods::POST, std::bind(&API::handle_post, this, std::placeholders::_1));
    listener.support(methods::PUT, std::bind(&API::handle_put, this, std::placeholders::_1));
    listener.support(methods::DELETE, std::bind(&API::handle_delete, this, std::placeholders::_1));
}

void API::run(){
    try {
        listener.open().then([this](pplx::task<void> t) {
            try {
                t.get();
                spdlog::info("API server listening on: {}", listen_address);
            }
            catch (const std::exception& e) {
                spdlog::error("Error starting API server: {}", e.what());
            }
        });
        //Keep the main thread running
        std::this_thread::sleep_for(std::chrono::seconds(60));
    }
    catch (const std::exception& e){
        spdlog::error("Error running API server: {}", e.what());
    }
}

pplx::task<void> API::handle_get(http_request request) {
    //Handle get requests here
    return pplx::task<void>();
}

pplx::task<void> API::handle_post(http_request request) {
    //Handle post requests here
    return pplx::task<void>();
}

pplx::task<void> API::handle_put(http_request request) {
    //Handle put requests here
    return pplx::task<void>();
}

pplx::task<void> API::handle_delete(http_request request) {
    //Handle delete requests here
    return pplx::task<void>();
}
```