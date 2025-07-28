#include <iostream>
#include "api.h"
#include "database.h"

int main() {
  // Initialize database connection
  Database db("dbname=authdb user=authuser password=authpassword host=localhost port=5432");

  // Initialize API server (using a placeholder for simplicity)
  APIServer server(db);
  server.start();

  return 0;
}