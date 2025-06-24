```cpp
#ifndef API_H
#define API_H

#include "database.h"
#include <string>
//Include your web framework header file
//Example using cpprestsdk
#include <cpprestsdk/http_listener.h>
#include <cpprestsdk/json.h>


class API {
public:
    API(Database& db);
    void run();

private:
    Database& db;
    //Add your web framework instance here for handling the routes
    //Example using cpprestsdk
    utility::string_t listen_address;
    http_listener listener;
    
    //Define API endpoints functions here
};

#endif
```