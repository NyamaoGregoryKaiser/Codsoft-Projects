```cpp
#pragma once

#include <drogon/drogon.h>
#include <drogon/orm/DbClient.h>
#include <drogon/orm/Result.h>
#include <drogon/orm/Row.h>
#include <drogon/orm/Exception.h>
#include <trantor/net/EventLoop.h>
#include <functional>
#include <memory>
#include <string>

#include "src/utils/Logger.h"
#include "src/exceptions/ApiException.h"

namespace dao
{
    /**
     * @brief Base class for Data Access Objects (DAOs).
     * Provides common database interaction methods and error handling.
     * Uses Drogon's asynchronous database client.
     */
    class BaseDAO
    {
    protected:
        std::shared_ptr<drogon::orm::DbClient> dbClient_;
        const std::string tableName_;

    public:
        /**
         * @brief Constructor for BaseDAO.
         * Initializes the database client.
         * @param tableName The name of the table this DAO interacts with.
         */
        explicit BaseDAO(std::string tableName);

        virtual ~BaseDAO() = default;

    protected:
        /**
         * @brief Executes a database query asynchronously.
         * @param sql The SQL query string.
         * @param params The query parameters.
         * @return A Future that resolves to drogon::orm::Result.
         * @throws api::ApiException on database errors.
         */
        drogon::orm::Result executeQuery(const std::string &sql,
                                       const std::vector<drogon::orm::internal::OptionalType> &params = {}) const;

        /**
         * @brief Executes a database update/insert/delete query asynchronously.
         * @param sql The SQL query string.
         * @param params The query parameters.
         * @return A Future that resolves to the number of affected rows.
         * @throws api::ApiException on database errors.
         */
        drogon::orm::Result executeUpdate(const std::string &sql,
                                       const std::vector<drogon::orm::internal::OptionalType> &params = {}) const;

        /**
         * @brief Handles common database exceptions.
         * @param e The Drogon database exception.
         * @param context Additional context for logging.
         * @throws api::ApiException converted from the database exception.
         */
        void handleDbException(const drogon::orm::DrogonDbException &e, const std::string &context) const;
    };

} // namespace dao
```