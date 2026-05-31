```cpp
#include "jwt_manager.hpp"
#include <chrono>

namespace Zenith {
namespace Utils {

JwtManager& JwtManager::getInstance() {
    static JwtManager instance;
    return instance;
}

JwtManager::JwtManager()
    : secret_(Config::AppConfig::getInstance().getJwtSecret()),
      expiration_seconds_(Config::AppConfig::getInstance().getJwtExpirationSeconds())
{}

std::string JwtManager::generateToken(const JwtPayload& payload) {
    using namespace std::chrono;
    auto now = system_clock::now();
    auto expires_at = now + seconds(expiration_seconds_);

    std::string token = jwt::create()
        .set_issuer("zenith-payments")
        .set_type("JWS")
        .set_id(std::to_string(std::hash<long>{}(payload.user_id))) // Unique ID for token
        .set_subject(std::to_string(payload.user_id))
        .set_issued_at(now)
        .set_expires_at(expires_at)
        .set_payload_claim("username", jwt::claim(payload.username))
        .set_payload_claim("email", jwt::claim(payload.email))
        .set_payload_claim("role", jwt::claim(payload.role))
        .sign(jwt::algorithm::hs256{secret_});
    
    LOG_DEBUG("Generated JWT for user_id {0}, expires at {1}", payload.user_id, std::chrono::format("%FT%TZ", expires_at));
    return token;
}

std::optional<JwtPayload> JwtManager::verifyToken(const std::string& token) {
    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{secret_})
            .with_issuer("zenith-payments");

        auto decoded_token = jwt::decode(token);
        verifier.verify(decoded_token); // Throws if invalid/expired

        JwtPayload payload;
        payload.user_id = std::stol(decoded_token.get_subject());
        payload.username = decoded_token.get_payload_claim("username").as_string();
        payload.email = decoded_token.get_payload_claim("email").as_string();
        payload.role = decoded_token.get_payload_claim("role").as_string();

        LOG_DEBUG("Successfully verified JWT for user_id {0}", payload.user_id);
        return payload;
    } catch (const jwt::error::token_verification_exception& e) {
        LOG_WARN("JWT verification failed: {0}", e.what());
        return std::nullopt;
    } catch (const std::exception& e) {
        LOG_ERROR("Error processing JWT: {0}", e.what());
        return std::nullopt;
    }
}

} // namespace Utils
} // namespace Zenith
```