#include <iostream>
#include "database.h"
#include "api.h"

int main() {
  std::cout << "Starting API..." << std::endl;

  // Database setup
  Database db("mydatabase.db");
  db.migrate();  //Run migrations

  // API server setup (replace with actual server implementation)
  API api(db);
  api.run();

  return 0;
}