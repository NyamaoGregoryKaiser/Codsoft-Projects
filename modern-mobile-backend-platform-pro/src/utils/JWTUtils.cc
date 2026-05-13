```cpp
#include "JWTUtils.h"
#include "Logger.h"
#include "AppConfig.h"
#include <picojson.h> // For PicoJWT
#include <picojwt.h>  // For PicoJWT library

// Forward declare the PicoJWT::Context to allow unique_ptr usage
namespace PicoJWT {
    class Context {
    public:
        // Assume default constructor or factory method based on actual PicoJWT setup
        Context(const std::string& secret) : secret_(secret) {}

        std::string sign(const picojson::value& claims) {
            // Simplified, real PicoJWT::Context would handle this.
            // This mock assumes base64 encoding and simple concatenation for JWT.
            // For a real PicoJWT, you'd use `PicoJWT::sign()`
            std::string header = R"({"alg":"HS256","typ":"JWT"})";
            std::string encodedHeader = picojwt::base64url::encode(header);
            std::string encodedClaims = picojwt::base64url::encode(claims.serialize());
            std::string unsignedToken = encodedHeader + "." + encodedClaims;

            // Simplified HMAC-SHA256 signature
            std::string signature = picojwt::hmac_sha256(secret_, unsignedToken);
            std::string encodedSignature = picojwt::base64url::encode(signature);

            return unsignedToken + "." + encodedSignature;
        }

        picojson::value verify(const std::string& token) {
            // Simplified verification. Real PicoJWT::Context would handle full validation.
            auto parts = picojwt::split(token, '.');
            if (parts.size() != 3) {
                LOG_WARN("Invalid JWT format: expected 3 parts, got {}", parts.size());
                return picojson::value();
            }

            std::string encodedHeader = parts[0];
            std::string encodedClaims = parts[1];
            std::string encodedSignature = parts[2];

            std::string unsignedToken = encodedHeader + "." + encodedClaims;
            std::string expectedSignature = picojwt::hmac_sha256(secret_, unsignedToken);
            std::string decodedSignature = picojwt::base64url::decode(encodedSignature);

            if (expectedSignature != decodedSignature) {
                LOG_WARN("JWT signature verification failed.");
                return picojson::value();
            }

            // Decode claims
            std::string claimsStr = picojwt::base64url::decode(encodedClaims);
            picojson::value claims;
            std::string err = picojson::parse(claims, claimsStr);
            if (!err.empty()) {
                LOG_ERROR("Failed to parse JWT claims: {}", err);
                return picojson::value();
            }

            // Check expiration (exp)
            if (claims.is<picojson::object>() && claims.get<picojson::object>().count("exp")) {
                long long exp = (long long)claims.get<picojson::object>()["exp"].get<double>();
                auto now = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                if (now >= exp) {
                    LOG_WARN("JWT has expired.");
                    return picojson::value();
                }
            }

            return claims;
        }

    private:
        std::string secret_;
    };
}


namespace utils
{
    std::unique_ptr<PicoJWT::Context> JWTUtils::jwtContext_ = nullptr;
    std::string JWTUtils::jwtSecret_ = "";

    void JWTUtils::initialize(const std::string &secret)
    {
        if (secret.empty())
        {
            LOG_CRITICAL("JWT secret is empty. JWT functionality will be disabled or insecure.");
            throw std::runtime_error("JWT secret cannot be empty.");
        }
        jwtSecret_ = secret;
        jwtContext_ = std::make_unique<PicoJWT::Context>(secret);
        LOG_INFO("JWTUtils initialized.");
    }

    std::string JWTUtils::generateToken(const std::string &userId, const std::string &username, int expiresInMinutes)
    {
        if (!jwtContext_)
        {
            LOG_ERROR("JWTUtils not initialized. Cannot generate token.");
            throw std::runtime_error("JWTUtils not initialized.");
        }

        try
        {
            auto now = std::chrono::system_clock::now();
            auto expiresAt = now + std::chrono::minutes(expiresInMinutes);

            long long iat = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();
            long long exp = std::chrono::duration_cast<std::chrono::seconds>(expiresAt.time_since_epoch()).count();

            picojson::object claims_obj;
            claims_obj["sub"] = picojson::value(userId);
            claims_obj["username"] = picojson::value(username);
            claims_obj["iat"] = picojson::value((double)iat);
            claims_obj["exp"] = picojson::value((double)exp);

            picojson::value claims(claims_obj);

            std::string token = jwtContext_->sign(claims);
            LOG_DEBUG("Generated JWT for user '{}': {}", username, token);
            return token;
        }
        catch (const std::exception &e)
        {
            LOG_ERROR("Failed to generate JWT: {}", e.what());
            throw std::runtime_error("Failed to generate JWT");
        }
    }

    nlohmann::json JWTUtils::validateToken(const std::string &token)
    {
        if (!jwtContext_)
        {
            LOG_ERROR("JWTUtils not initialized. Cannot validate token.");
            return {};
        }

        try
        {
            picojson::value claims = jwtContext_->verify(token);
            if (claims.is<picojson::object>())
            {
                nlohmann::json jsonClaims = nlohmann::json::parse(claims.serialize());
                LOG_DEBUG("Successfully validated JWT. Claims: {}", jsonClaims.dump());
                return jsonClaims;
            }
            LOG_WARN("JWT validation failed or claims are not an object for token: {}", token);
            return {};
        }
        catch (const std::exception &e)
        {
            LOG_ERROR("JWT validation threw an exception: {}", e.what());
            return {};
        }
    }

    std::string JWTUtils::getUserIdFromToken(const std::string &token)
    {
        nlohmann::json claims = validateToken(token);
        if (!claims.empty() && claims.count("sub") && claims["sub"].is_string())
        {
            return claims["sub"].get<std::string>();
        }
        return "";
    }

} // namespace utils
```