#include "UserController.h"
#include "common/JsonUtils.h"
#include "common/ErrorHandling.h"
#include "spdlog/spdlog.h"

UserService UserController::user_service; // Initialize static service instance

void UserController::getCurrentUser(const crow::request& req, crow::response& res) {
    try {
        std::string user_id = AuthMiddleware::getUserIdFromRequest(req);
        if (user_id.empty()) {
            throw UnauthorizedError("User ID not found in token.");
        }

        std::optional<User> user_opt = user_service.getUserById(user_id);
        if (!user_opt.has_value()) {
            throw NotFoundError("User not found.");
        }

        JsonUtils::sendSuccessResponse(res, crow::HTTPResponseCode::OK, user_opt.value().toJson());
    } catch (const std::exception& e) {
        handle_exception(res, e);
    }
}
```