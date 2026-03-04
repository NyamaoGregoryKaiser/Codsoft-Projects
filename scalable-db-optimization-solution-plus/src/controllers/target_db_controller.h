```cpp
#ifndef OPTIDB_TARGET_DB_CONTROLLER_H
#define OPTIDB_TARGET_DB_CONTROLLER_H

#include <crow.h>
#include <memory>

#include "services/target_db_service.h"
#include "services/optimization_engine.h"
#include "utils/logger.h"
#include "utils/json_util.h"
#include "common/exceptions.h"
#include "common/constants.h" // For AUTHORIZED_USER_ID_KEY

class TargetDbController {
public:
    TargetDbController(crow::SimpleApp& app,
                       std::shared_ptr<TargetDbService> target_db_service,
                       std::shared_ptr<OptimizationEngine> optimization_engine);

private:
    std::shared_ptr<TargetDbService> target_db_service_;
    std::shared_ptr<OptimizationEngine> optimization_engine_;

    void setup_routes(crow::SimpleApp& app);
};

#endif // OPTIDB_TARGET_DB_CONTROLLER_H
```