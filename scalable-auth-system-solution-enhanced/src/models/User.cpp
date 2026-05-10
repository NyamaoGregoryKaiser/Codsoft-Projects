```cpp
#include "User.h"
#include "../utils/Logger.h"
#include <boost/uuid/uuid.hpp>            // for uuid
#include <boost/uuid/uuid_generators.hpp> // for nil_generator, string_generator
#include <boost/uuid/uuid_io.hpp>         // for to_string
#include <ctime> // For std::time_t, std::localtime
#include <iomanip> // For std::put_time

// Default constructor
User::User() : db_(nullptr), is_deleted_(false) {}

User::User(std::shared_ptr<Database> db) : db_(std::move(db)), is_deleted_(false) {}

User::User(const std::string& id, const std::string& username, const std::string& email, 
           const std::string& passwordHash, const std::string& createdAt, const std::string& updatedAt,
           bool isDeleted, std::shared_ptr<Database> db)
    : id_(id), username_(username), email_(email), password_hash_(passwordHash), 
      created_at_(createdAt), updated_at_(updatedAt), is_deleted_(isDeleted), db_(std::move(db)) {}

const std::string& User::getId() const { return id_; }
const std::string& User::getUsername() const { return username_; }
const std::string& User::getEmail() const { return email_; }
const std::string& User::getPasswordHash() const { return password_hash_; }
const std::string& User::getCreatedAt() const { return created_at_; }
const std::string& User::getUpdatedAt() const { return updated_at_; }
bool User::getIsDeleted() const { return is_deleted_; }

void User::setUsername(const std::string& username) { username_ = username; }
void User::setEmail(const std::string& email) { email_ = email; }
void User::setPasswordHash(const std::string& passwordHash) { password_hash_ = passwordHash; }
void User::setIsDeleted(bool isDeleted) { is_deleted_ = isDeleted; }

void User::fromDbRow(const std::map<std::string, std::string>& row) {
    id_ = row.at("id");
    username_ = row.at("username");
    email_ = row.at("email");
    password_hash_ = row.at("password_hash");
    created_at_ = row.at("created_at");
    updated_at_ = row.at("updated_at");
    is_deleted_ = (row.at("is_deleted") == "1");
}

bool User::findById(const std::string& id) {
    if (!db_) {
        LOG_ERROR("Database not initialized for User model.");
        throw UserException("Database not initialized for User model.");
    }
    std::string sql = "SELECT id, username, email, password_hash, created_at, updated_at, is_deleted FROM users WHERE id = ? AND is_deleted = 0;";
    std::map<std::string, std::string> row = db_->querySingle(sql, {id});
    if (!row.empty()) {
        fromDbRow(row);
        return true;
    }
    return false;
}

bool User::findByEmail(const std::string& email) {
    if (!db_) {
        LOG_ERROR("Database not initialized for User model.");
        throw UserException("Database not initialized for User model.");
    }
    std::string sql = "SELECT id, username, email, password_hash, created_at, updated_at, is_deleted FROM users WHERE email = ? AND is_deleted = 0;";
    std::map<std::string, std::string> row = db_->querySingle(sql, {email});
    if (!row.empty()) {
        fromDbRow(row);
        return true;
    }
    return false;
}

bool User::create() {
    if (!db_) {
        LOG_ERROR("Database not initialized for User model.");
        throw UserException("Database not initialized for User model.");
    }

    if (findByEmail(email_)) { // Check if email already exists and is not deleted
        LOG_WARN("Attempted to create user with existing email: %s", email_.c_str());
        throw UserException("Email already registered.");
    }

    id_ = generateUuid();
    std::string sql = "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?);";
    try {
        db_->execute(sql, {id_, username_, email_, password_hash_});
        // After successful insertion, set created_at and updated_at
        // This is a simplified approach, in production, fetch from DB or use timestamp_function.
        auto t = std::time(nullptr);
        auto tm = *std::localtime(&t);
        std::ostringstream oss;
        oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
        created_at_ = oss.str();
        updated_at_ = oss.str();
        LOG_INFO("User created: %s (%s)", username_.c_str(), email_.c_str());
        return true;
    } catch (const DatabaseException& e) {
        LOG_ERROR("Failed to create user %s: %s", email_.c_str(), e.what());
        // Propagate specific database errors if needed, or re-throw as UserException
        throw UserException("Failed to create user: " + std::string(e.what()));
    }
}

bool User::update() {
    if (!db_ || id_.empty()) {
        LOG_ERROR("Database not initialized or User ID not set for update.");
        throw UserException("Database not initialized or User ID not set.");
    }

    // Check if new email conflicts with another active user
    if (!email_.empty()) {
        std::string check_email_sql = "SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0;";
        std::map<std::string, std::string> existing_user = db_->querySingle(check_email_sql, {email_, id_});
        if (!existing_user.empty()) {
            LOG_WARN("Attempted to update user %s with existing email: %s", id_.c_str(), email_.c_str());
            throw UserException("Email already registered by another user.");
        }
    }
    
    // Update updated_at timestamp
    auto t = std::time(nullptr);
    auto tm = *std::localtime(&t);
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
    updated_at_ = oss.str();

    std::string sql = "UPDATE users SET username = ?, email = ?, password_hash = ?, updated_at = ? WHERE id = ?;";
    try {
        db_->execute(sql, {username_, email_, password_hash_, updated_at_, id_});
        LOG_INFO("User updated: %s (%s)", username_.c_str(), email_.c_str());
        return true;
    } catch (const DatabaseException& e) {
        LOG_ERROR("Failed to update user %s: %s", id_.c_str(), e.what());
        throw UserException("Failed to update user: " + std::string(e.what()));
    }
}

bool User::softDelete() {
    if (!db_ || id_.empty()) {
        LOG_ERROR("Database not initialized or User ID not set for soft delete.");
        throw UserException("Database not initialized or User ID not set.");
    }

    // Update updated_at timestamp
    auto t = std::time(nullptr);
    auto tm = *std::localtime(&t);
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
    updated_at_ = oss.str();

    std::string sql = "UPDATE users SET is_deleted = 1, updated_at = ? WHERE id = ?;";
    try {
        db_->execute(sql, {updated_at_, id_});
        is_deleted_ = true;
        LOG_INFO("User soft deleted: %s (%s)", id_.c_str(), email_.c_str());
        return true;
    } catch (const DatabaseException& e) {
        LOG_ERROR("Failed to soft delete user %s: %s", id_.c_str(), e.what());
        throw UserException("Failed to soft delete user: " + std::string(e.what()));
    }
}

std::string User::generateUuid() {
    boost::uuids::uuid uuid = boost::uuids::random_generator()();
    return boost::uuids::to_string(uuid);
}
```