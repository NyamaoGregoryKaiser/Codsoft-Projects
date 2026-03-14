#include "JwtManager.h"
#include <drogon/drogon.h>
#include <chrono>

std::string JwtManager::jwtSecret = "default_jwt_secret"; // Fallback default
int JwtManager::expiresInSeconds = 3600; // 1 hour
int JwtManager::refreshTokenExpiresInSeconds = 604800; // 7 days
bool JwtManager::initialized = false;

void JwtManager::initialize() {
    if (initialized) return;

    const auto& jwtConfig = drogon::app().getJsonValue("jwt");
    if (jwtConfig.isObject()) {
        jwtSecret = jwtConfig["secret"].asString();
        expiresInSeconds = jwtConfig["expires_in_seconds"].asInt();
        refreshTokenExpiresInSeconds = jwtConfig["refresh_token_expires_in_seconds"].asInt();
        LOG_INFO << "JWT Manager initialized with custom config. Secret length: " << jwtSecret.length();
    } else {
        LOG_WARN << "JWT configuration not found or invalid in config.json. Using default JWT secret and expiry settings.";
    }
    initialized = true;
}

void JwtManager::setSecret(const std::string& secret) {
    jwtSecret = secret;
    initialized = true; // Mark as initialized if secret is manually set
}

std::string JwtManager::generateToken(const std::string& userId,
                                     const std::string& username,
                                     const std::string& role) {
    initialize(); // Ensure settings are loaded

    auto token = jwt::create()
        .set_issuer("cms-cpp-server")
        .set_type("JWT")
        .set_issued_at(std::chrono::system_clock::now())
        .set_expires_at(std::chrono::system_clock::now() + std::chrono::seconds(expiresInSeconds))
        .set_payload_claim("user_id", jwt::claim(userId))
        .set_payload_claim("username", jwt::claim(username))
        .set_payload_claim("role", jwt::claim(role))
        .sign(jwt::algorithm::hs256{jwtSecret});
    return token;
}

bool JwtManager::verifyToken(const std::string& token,
                            Json::Value& payload,
                            std::string& error) {
    initialize(); // Ensure settings are loaded

    try {
        auto decoded_token = jwt::decode(token);
        jwt::verify(jwt::algorithm::hs256{jwtSecret})
            .set_issuer("cms-cpp-server")
            .verify(decoded_token);

        // Convert claims to Json::Value
        for (auto& e : decoded_token.get_payload_claims()) {
            if (e.second.is_string()) {
                payload[e.first] = e.second.as_string();
            } else if (e.second.is_integer()) {
                payload[e.first] = (Json::Int64)e.second.as_int(); // For timestamps
            } else if (e.second.is_array()) {
                Json::Value arr = Json::arrayValue;
                for (const auto& item : e.second.as_array()) {
                    arr.append(item.as_string());
                }
                payload[e.first] = arr;
            }
            // Handle other types if necessary
        }
        return true;
    } catch (const jwt::verification_error& e) {
        error = std::string("Verification failed: ") + e.what();
        LOG_WARN << "JWT verification error: " << e.what();
        return false;
    } catch (const std::exception& e) {
        error = std::string("General JWT error: ") + e.what();
        LOG_ERROR << "General JWT error: " << e.what();
        return false;
    }
}