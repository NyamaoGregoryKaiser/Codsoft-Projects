```cpp
#include "BaseDAO.h"
#include "src/utils/AppConfig.h" // For database connection string
#include <format> // C++20 for std::format

namespace dao
{
    BaseDAO::BaseDAO(std::string tableName)
        : tableName_(std::move(tableName))
    {
        auto &config = utils::AppConfig::getInstance();
        std::string dbHost = config.getString("database.host");
        int dbPort = config.getInt("database.port");
        std::string dbName = config.getString("database.name");
        std::string dbUser = config.getString("database.user");
        std::string dbPassword = config.getString("database.password");

        std::string connInfo = std::format("host={} port={} dbname={} user={} password={}",
                                           dbHost, dbPort, dbName, dbUser, dbPassword);

        // Get a database client instance (Drogon manages pooling)
        dbClient_ = drogon::orm::DbClient::newPgClient(connInfo, 1); // 1 for a single connection, pool_size could be >1
        if (!dbClient_)
        {
            LOG_CRITICAL("Failed to create DB client for table {}. Connection info: {}", tableName_, connInfo);
            throw std::runtime_error("Failed to initialize database client.");
        }
        LOG_DEBUG("DB Client initialized for table: {}", tableName_);
    }

    drogon::orm::Result BaseDAO::executeQuery(const std::string &sql,
                                              const std::vector<drogon::orm::internal::OptionalType> &params) const
    {
        try
        {
            auto future = dbClient_->execSqlAsync(sql, params);
            return future.get(); // Blocks until result is available
        }
        catch (const drogon::orm::DrogonDbException &e)
        {
            handleDbException(e, "executeQuery on " + tableName_ + " with SQL: " + sql);
        }
        return drogon::orm::Result(); // Should not reach here
    }

    drogon::orm::Result BaseDAO::executeUpdate(const std::string &sql,
                                              const std::vector<drogon::orm::internal::OptionalType> &params) const
    {
        try
        {
            auto future = dbClient_->execSqlAsync(sql, params);
            return future.get(); // Blocks until result is available
        }
        catch (const drogon::orm::DrogonDbException &e)
        {
            handleDbException(e, "executeUpdate on " + tableName_ + " with SQL: " + sql);
        }
        return drogon::orm::Result(); // Should not reach here
    }

    void BaseDAO::handleDbException(const drogon::orm::DrogonDbException &e, const std::string &context) const
    {
        std::string errorMsg = std::format("Database error in {}: {}", context, e.what());
        LOG_ERROR("{}", errorMsg);

        // Map common SQL states to API exceptions
        // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
        if (e.getSqlState() == "23505") // unique_violation
        {
            throw api::ConflictException(errorMsg, "DB_UNIQUE_CONSTRAINT_VIOLATION");
        }
        else if (e.getSqlState() == "23503") // foreign_key_violation
        {
            throw api::BadRequestException(errorMsg, "DB_FOREIGN_KEY_VIOLATION");
        }
        else if (e.getSqlState().rfind("22", 0) == 0) // data_exception (e.g. invalid text representation)
        {
            throw api::BadRequestException(errorMsg, "DB_DATA_EXCEPTION");
        }
        else if (e.getSqlState().rfind("42", 0) == 0) // syntax_error or access_violation
        {
            throw api::InternalServerErrorException(errorMsg, "DB_INVALID_QUERY_OR_ACCESS");
        }
        // Default to internal server error for unhandled DB exceptions
        throw api::ApiException(errorMsg, drogon::k500InternalServerError, "DB_INTERNAL_ERROR");
    }

} // namespace dao
```