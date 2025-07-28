#include "database.h"
#include <iostream>
//Implementation of Database class methods here.  This would include extensive error handling and query optimization using prepared statements.

Database::Database(const std::string& connectionString) : conn(connectionString) {
    if(conn.is_open()){
        std::cout << "Database connection successful!" << std::endl;
    } else {
        std::cerr << "Database connection failed!" << std::endl;
    }
}

Database::~Database() {
    if (conn.is_open()) {
        conn.disconnect();
    }
}


//Example function
bool Database::addUser(const std::string& username, const std::string& password) {
    try {
        pqxx::work txn(conn);
        //Use prepared statements for security
        txn.exec_params("INSERT INTO users (username, password) VALUES ($1, $2)", username, password); //Simplified, needs proper password hashing
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error adding user: " << e.what() << std::endl;
        return false;
    }
}