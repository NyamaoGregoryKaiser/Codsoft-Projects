#ifndef AUTH_SYSTEM_ERRORMIDDLEWARE_H
#define AUTH_SYSTEM_ERRORMIDDLEWARE_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <nlohmann/json.hpp>
#include "../exceptions/AuthException.h"
#include "../logger/Logger.h"

namespace Middleware {

    inline void handleErrors(const std::exception& e, const Pistache::Rest::Request& req, Pistache::Http::ResponseWriter response) {
        nlohmann::json errorResponse;
        int statusCode = Pistache::Http::Code::Internal_Server_Error;
        std::string errorMessage = "Internal Server Error";

        try {
            std::rethrow_exception(std::current_exception());
        } catch (const AuthException& authEx) {
            statusCode = authEx.getHttpStatusCode();
            errorMessage = authEx.what();
            Logger::getLogger()->warn("AuthException on {} {}: {}", req.method().toString(), req.resource(), authEx.what());
        } catch (const nlohmann::json::exception& jsonEx) {
            statusCode = Pistache::Http::Code::Bad_Request;
            errorMessage = "Invalid JSON format: " + std::string(jsonEx.what());
            Logger::getLogger()->warn("JSON parsing error on {} {}: {}", req.method().toString(), req.resource(), jsonEx.what());
        } catch (const std::runtime_error& rtEx) {
            statusCode = Pistache::Http::Code::Bad_Request;
            errorMessage = rtEx.what();
            Logger::getLogger()->error("Runtime error on {} {}: {}", req.method().toString(), req.resource(), rtEx.what());
        } catch (const std::exception& genEx) {
            errorMessage = "An unexpected error occurred: " + std::string(genEx.what());
            Logger::getLogger()->error("Unhandled exception on {} {}: {}", req.method().toString(), req.resource(), genEx.what());
        } catch (...) {
            Logger::getLogger()->critical("Unknown exception caught on {} {}", req.method().toString(), req.resource());
        }

        errorResponse["status"] = "error";
        errorResponse["message"] = errorMessage;

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(static_cast<Pistache::Http::Code>(statusCode), errorResponse.dump());
    }

} // namespace Middleware

#endif // AUTH_SYSTEM_ERRORMIDDLEWARE_H