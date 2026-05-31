```cpp
#include "user_repository.hpp"
#include "../db_connection.hpp"
#include "../../utils/logger.hpp"
#include <pqxx/pqxx>
#include <chrono> // For converting pqxx::date to std::chrono::system_clock::time_point

namespace Zenith {
namespace Database {

// Helper function to convert pqxx::result::field to std::chrono::system_clock::time_point
static std::chrono::system_clock::time_point parseTimestamp(const std::string& ts_str) {
    std::tm tm_struct = {};
    std::istringstream ss(ts_str);
    // Expected format: YYYY-MM-DD HH:MM:SS.ffffff+ZZ
    // We'll parse YYYY-MM-DD HH:MM:SS, ignoring milliseconds and timezone for simplicity.
    // A more robust solution might use a dedicated date/time parsing library or C++20 chrono::parse.
    ss >> std::get_time(&tm_struct, "%Y-%m-%d %H:%M:%S"); // Parses YYYY-MM-DD HH:MM:SS

    if (ss.fail()) {
        LOG_WARN("Failed to parse timestamp string: {0}", ts_str);
        return std::chrono::system_clock::time_point{}; // Return epoch
    }
    
    // Convert std::tm to std::time_t
    std::time_t tt = std::mktime(&tm_struct);
    if (tt == -1) {
        LOG_WARN("Failed to convert std::tm to std::time_t for timestamp: {0}", ts_str);
        return std::chrono::system_clock::time_point{};
    }

    return std::chrono::system_clock::from_time_t(tt);
}


std::optional<Models::User> UserRepository::findById(long id) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params(
            "SELECT id, username, email, password_hash, full_name, address, phone_number, created_at, updated_at, role FROM users WHERE id = $1",
            id
        );

        if (R.empty()) {
            DBConnection::getInstance().releaseConnection(conn);
            return std::nullopt;
        }

        const auto& row = R[0];
        Models::User user;
        user.id = row["id"].as<long>();
        user.username = row["username"].as<std::string>();
        user.email = row["email"].as<std::string>();
        user.password_hash = row["password_hash"].as<std::string>();
        user.full_name = row["full_name"].as<std::string>();
        user.address = row["address"].as<std::string>();
        user.phone_number = row["phone_number"].as<std::string>();
        user.created_at = parseTimestamp(row["created_at"].as<std::string>());
        user.updated_at = parseTimestamp(row["updated_at"].as<std::string>());
        user.role = row["role"].as<std::string>();

        DBConnection::getInstance().releaseConnection(conn);
        return user;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User findById error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        return std::nullopt;
    }
}

std::optional<Models::User> UserRepository::findByEmail(const std::string& email) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params(
            "SELECT id, username, email, password_hash, full_name, address, phone_number, created_at, updated_at, role FROM users WHERE email = $1",
            email
        );

        if (R.empty()) {
            DBConnection::getInstance().releaseConnection(conn);
            return std::nullopt;
        }

        const auto& row = R[0];
        Models::User user;
        user.id = row["id"].as<long>();
        user.username = row["username"].as<std::string>();
        user.email = row["email"].as<std::string>();
        user.password_hash = row["password_hash"].as<std::string>();
        user.full_name = row["full_name"].as<std::string>();
        user.address = row["address"].as<std::string>();
        user.phone_number = row["phone_number"].as<std::string>();
        user.created_at = parseTimestamp(row["created_at"].as<std::string>());
        user.updated_at = parseTimestamp(row["updated_at"].as<std::string>());
        user.role = row["role"].as<std::string>();

        DBConnection::getInstance().releaseConnection(conn);
        return user;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User findByEmail error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        return std::nullopt;
    }
}

std::optional<Models::User> UserRepository::findByUsername(const std::string& username) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params(
            "SELECT id, username, email, password_hash, full_name, address, phone_number, created_at, updated_at, role FROM users WHERE username = $1",
            username
        );

        if (R.empty()) {
            DBConnection::getInstance().releaseConnection(conn);
            return std::nullopt;
        }

        const auto& row = R[0];
        Models::User user;
        user.id = row["id"].as<long>();
        user.username = row["username"].as<std::string>();
        user.email = row["email"].as<std::string>();
        user.password_hash = row["password_hash"].as<std::string>();
        user.full_name = row["full_name"].as<std::string>();
        user.address = row["address"].as<std::string>();
        user.phone_number = row["phone_number"].as<std::string>();
        user.created_at = parseTimestamp(row["created_at"].as<std::string>());
        user.updated_at = parseTimestamp(row["updated_at"].as<std::string>());
        user.role = row["role"].as<std::string>();

        DBConnection::getInstance().releaseConnection(conn);
        return user;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User findByUsername error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        return std::nullopt;
    }
}


std::vector<Models::User> UserRepository::findAll() {
    auto conn = DBConnection::getInstance().getConnection();
    std::vector<Models::User> users;
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec("SELECT id, username, email, password_hash, full_name, address, phone_number, created_at, updated_at, role FROM users ORDER BY id");

        for (const auto& row : R) {
            Models::User user;
            user.id = row["id"].as<long>();
            user.username = row["username"].as<std::string>();
            user.email = row["email"].as<std::string>();
            user.password_hash = row["password_hash"].as<std::string>();
            user.full_name = row["full_name"].as<std::string>();
            user.address = row["address"].as<std::string>();
            user.phone_number = row["phone_number"].as<std::string>();
            user.created_at = parseTimestamp(row["created_at"].as<std::string>());
            user.updated_at = parseTimestamp(row["updated_at"].as<std::string>());
            user.role = row["role"].as<std::string>();
            users.push_back(user);
        }

        DBConnection::getInstance().releaseConnection(conn);
        return users;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User findAll error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        return {};
    }
}

long UserRepository::create(const Models::User& user) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "INSERT INTO users (username, email, password_hash, full_name, address, phone_number, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            user.username, user.email, user.password_hash, user.full_name, user.address, user.phone_number, user.role
        );
        W.commit();
        long new_id = R[0]["id"].as<long>();
        DBConnection::getInstance().releaseConnection(conn);
        LOG_INFO("Created new user with ID: {0}", new_id);
        return new_id;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User create error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        throw; // Re-throw to handle unique constraint violations etc.
    }
}

bool UserRepository::update(const Models::User& user) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "UPDATE users SET username=$1, email=$2, password_hash=$3, full_name=$4, address=$5, phone_number=$6, updated_at=NOW(), role=$7 WHERE id=$8",
            user.username, user.email, user.password_hash, user.full_name, user.address, user.phone_number, user.role, user.id
        );
        W.commit();
        DBConnection::getInstance().releaseConnection(conn);
        LOG_INFO("Updated user with ID: {0}. Rows affected: {1}", user.id, R.affected_rows());
        return R.affected_rows() == 1;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User update error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        throw;
    }
}

bool UserRepository::deleteById(long id) {
    auto conn = DBConnection::getInstance().getConnection();
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params("DELETE FROM users WHERE id = $1", id);
        W.commit();
        DBConnection::getInstance().releaseConnection(conn);
        LOG_INFO("Deleted user with ID: {0}. Rows affected: {1}", id, R.affected_rows());
        return R.affected_rows() == 1;
    } catch (const pqxx::sql_error& e) {
        LOG_ERROR("User deleteById error: {0}", e.what());
        DBConnection::getInstance().releaseConnection(conn);
        return false;
    }
}

} // namespace Database
} // namespace Zenith
```