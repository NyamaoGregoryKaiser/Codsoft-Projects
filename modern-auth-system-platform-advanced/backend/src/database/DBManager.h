#ifndef AUTH_SYSTEM_DBMANAGER_H
#define AUTH_SYSTEM_DBMANAGER_H

#include <pqxx/pqxx>
#include <string>
#include <optional>
#include <vector>
#include <memory>
#include "../models/User.h"

class DBManager {
public:
    static DBManager& getInstance(); // Singleton pattern
    ~DBManager();

    // Prevent copy and assignment
    DBManager(const DBManager&) = delete;
    DBManager& operator=(const DBManager&) = delete;

    void connect(const std::string& connInfo);
    void disconnect();
    bool isConnected() const;

    // User CRUD operations
    std::optional<User> createUser(const std::string& username, const std::string& passwordHash, UserRole role);
    std::optional<User> findUserById(int id);
    std::optional<User> findUserByUsername(const std::string& username);
    bool updateUser(const User& user); // Updates username, password hash, role
    bool deleteUser(int id); // Soft delete in a real system, hard delete here for simplicity
    std::vector<User> getAllUsers();

private:
    DBManager(); // Private constructor for singleton

    std::unique_ptr<pqxx::connection> conn;
    std::string connectionString;
};

#endif // AUTH_SYSTEM_DBMANAGER_H