#ifndef API_H
#define API_H

#include "database.h"

class API {
public:
    API(Database& db);
    void run();
private:
    Database& db_;
    // Add API endpoint handling functions here
    // ...
};

#endif