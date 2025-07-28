#ifndef DATABASE_H
#define DATABASE_H

#include <pqxx/pqxx>

class Database {
public:
  Database(const std::string& connectionString);
  ~Database();
  // ... CRUD operations for users (addUser, getUser, updateUser, deleteUser) ...  
  // ... functions to handle authentication queries ...
private:
  pqxx::connection conn;
};

#endif