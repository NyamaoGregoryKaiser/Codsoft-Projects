#include "ErrorHandling.h"
#include "JsonUtils.h"
#include "spdlog/spdlog.h"

void handle_exception(crow::response& res, const std::exception& e) {
    if (auto* bre = dynamic_cast<const BadRequestError*>(&e)) {
        spdlog::warn("BadRequestError: {}", bre->what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::BadRequest, bre->what());
    } else if (auto* nfe = dynamic_cast<const NotFoundError*>(&e)) {
        spdlog::warn("NotFoundError: {}", nfe->what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::NotFound, nfe->what());
    } else if (auto* uae = dynamic_cast<const UnauthorizedError*>(&e)) {
        spdlog::warn("UnauthorizedError: {}", uae->what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Unauthorized, uae->what());
    } else if (auto* fbe = dynamic_cast<const ForbiddenError*>(&e)) {
        spdlog::warn("ForbiddenError: {}", fbe->what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::Forbidden, fbe->what());
    } else if (auto* ise = dynamic_cast<const InternalServerError*>(&e)) {
        spdlog::error("InternalServerError: {}", ise->what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::InternalServerError, "An internal server error occurred.");
    } else {
        spdlog::error("Unhandled exception: {}", e.what());
        JsonUtils::sendErrorResponse(res, crow::HTTPResponseCode::InternalServerError, "An unexpected error occurred.");
    }
}
```