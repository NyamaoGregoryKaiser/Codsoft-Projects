```cpp
#include "JwtManager.h"
#include "Logger.h"
#include <Poco/UUIDGenerator.h>
#include <Poco/UUID.h>
#include <Poco/DateTimeFormatter.h>
#include <Poco/DateTimeFormat.h>
#include <Poco/Base64Encoder.h>
#include <Poco/Base64Decoder.h>
#include <Poco/SHA2Engine.h> // For SHA256 (conceptual, not HMAC)
#include <sstream>
#include <iomanip> // For std::hex
#include <openssl/hmac.h> // For real HMAC (requires OpenSSL)

namespace AppUtils {

JwtManager& JwtManager::getInstance() {
    static JwtManager instance;
    return instance;
}

void JwtManager::initialize(const std::string& secret, int expiryMinutes) {
    secret_ = secret;
    expiryMinutes_ = expiryMinutes;
    LOG_INFO << "JWT Manager initialized. Expiry: " << expiryMinutes_ << " minutes.";
}

std::string JwtManager::base64Encode(const std::string& in) const {
    std::ostringstream oss;
    Poco::Base64Encoder encoder(oss);
    encoder << in;
    encoder.close();
    std::string encoded = oss.str();
    // Remove padding characters if present, as per JWT spec (URL-safe base64)
    encoded.erase(std::remove(encoded.begin(), encoded.end(), '='), encoded.end());
    return encoded;
}

std::string JwtManager::base64Decode(const std::string& in) const {
    std::istringstream iss(in);
    Poco::Base64Decoder decoder(iss);
    std::ostringstream oss;
    decoder >> oss.rdbuf(); // Read until EOF
    return oss.str();
}

std::string JwtManager::hmacSha256(const std::string& key, const std::string& msg) const {
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_len;

    HMAC_CTX* hmac_ctx = HMAC_CTX_new();
    if (!hmac_ctx) {
        LOG_ERROR << "Failed to create HMAC_CTX.";
        return "";
    }

    if (1 != HMAC_Init_ex(hmac_ctx, key.c_str(), key.length(), EVP_sha256(), nullptr)) {
        LOG_ERROR << "HMAC_Init_ex failed.";
        HMAC_CTX_free(hmac_ctx);
        return "";
    }
    if (1 != HMAC_Update(hmac_ctx, reinterpret_cast<const unsigned char*>(msg.c_str()), msg.length())) {
        LOG_ERROR << "HMAC_Update failed.";
        HMAC_CTX_free(hmac_ctx);
        return "";
    }
    if (1 != HMAC_Final(hmac_ctx, hash, &hash_len)) {
        LOG_ERROR << "HMAC_Final failed.";
        HMAC_CTX_free(hmac_ctx);
        return "";
    }

    HMAC_CTX_free(hmac_ctx);

    std::string result(reinterpret_cast<char*>(hash), hash_len);
    return result;
}


std::string JwtManager::generateToken(const std::map<std::string, std::string>& claims) const {
    if (secret_.empty()) {
        LOG_ERROR << "JWT secret not set. Cannot generate token.";
        return "";
    }

    Poco::JSON::Object header;
    header.set("alg", "HS256");
    header.set("typ", "JWT");

    Poco::JSON::Object payload;
    for (const auto& pair : claims) {
        payload.set(pair.first, pair.second);
    }

    // Add standard claims
    Poco::UUID uuid = Poco::UUIDGenerator().createRandom();
    payload.set("jti", uuid.toString()); // JWT ID
    payload.set("iat", std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count()); // Issued at
    payload.set("exp", std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch() + std::chrono::minutes(expiryMinutes_)).count()); // Expiration

    std::string encodedHeader = base64Encode(header.toString());
    std::string encodedPayload = base64Encode(payload.toString());

    std::string signatureInput = encodedHeader + "." + encodedPayload;
    std::string signature = base64Encode(hmacSha256(secret_, signatureInput));

    return encodedHeader + "." + encodedPayload + "." + signature;
}

Poco::JSON::Object::Ptr JwtManager::verifyToken(const std::string& token) const {
    if (secret_.empty()) {
        LOG_ERROR << "JWT secret not set. Cannot verify token.";
        return nullptr;
    }

    std::string::size_type firstDot = token.find('.');
    std::string::size_type secondDot = token.find('.', firstDot + 1);

    if (firstDot == std::string::npos || secondDot == std::string::npos) {
        LOG_WARN << "Invalid JWT format: missing dots.";
        return nullptr;
    }

    std::string encodedHeader = token.substr(0, firstDot);
    std::string encodedPayload = token.substr(firstDot + 1, secondDot - (firstDot + 1));
    std::string providedSignature = token.substr(secondDot + 1);

    // Re-calculate signature
    std::string signatureInput = encodedHeader + "." + encodedPayload;
    std::string expectedSignature = base64Encode(hmacSha256(secret_, signatureInput));

    if (providedSignature != expectedSignature) {
        LOG_WARN << "Invalid JWT signature.";
        return nullptr;
    }

    // Decode and parse payload
    try {
        std::string decodedPayload = base64Decode(encodedPayload);
        Poco::JSON::Parser parser;
        Poco::Dynamic::Var result = parser.parse(decodedPayload);
        Poco::JSON::Object::Ptr payload = result.extract<Poco::JSON::Object::Ptr>();

        // Check expiration
        if (payload->has("exp")) {
            long long expTime = payload->getValue<long long>("exp");
            long long currentTime = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();

            if (currentTime > expTime) {
                LOG_WARN << "JWT expired.";
                return nullptr;
            }
        }
        return payload;
    } catch (const Poco::Exception& e) {
        LOG_ERROR << "Failed to parse JWT payload: " << e.displayText();
        return nullptr;
    } catch (const std::exception& e) {
        LOG_ERROR << "Failed to parse JWT payload: " << e.what();
        return nullptr;
    }
}

} // namespace AppUtils
```