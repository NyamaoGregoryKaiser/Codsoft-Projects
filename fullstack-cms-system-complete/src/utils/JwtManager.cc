```cpp
#include "JwtManager.h"
#include "Logger.h"
#include <drogon/utils/string_view.h>
#include <drogon/utils/Utilities.h> // For base64 encoding/decoding

#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

#include <chrono>

namespace ApexContent::Utils {

std::string JwtManager::secret_key_;
long JwtManager::access_token_expiration_seconds_ = 0;
long JwtManager::refresh_token_expiration_seconds_ = 0;

void JwtManager::init(const std::string& secret, long expires_in_seconds, long refresh_expires_in_seconds) {
    secret_key_ = secret;
    access_token_expiration_seconds_ = expires_in_seconds;
    refresh_token_expiration_seconds_ = refresh_expires_in_seconds;
    if (secret_key_.empty()) {
        LOG_FATAL << "JWT_SECRET is empty! Tokens will not be secure.";
        exit(1);
    }
    LOG_INFO << "JWT Manager initialized with access token expiration: "
             << access_token_expiration_seconds_ << "s, refresh token expiration: "
             << refresh_token_expiration_seconds_ << "s.";
}

// Helper to replace characters for URL-safe base64
std::string base64UrlEncode(const std::string& input) {
    std::string encoded = drogon::utils::base64Encode(input);
    std::replace(encoded.begin(), encoded.end(), '+', '-');
    std::replace(encoded.begin(), encoded.end(), '/', '_');
    encoded.erase(std::remove(encoded.begin(), encoded.end(), '='), encoded.end());
    return encoded;
}

std::string base64UrlDecode(const std::string& input) {
    std::string decoded = input;
    std::replace(decoded.begin(), decoded.end(), '-', '+');
    std::replace(decoded.begin(), decoded.end(), '_', '/');
    while (decoded.length() % 4 != 0) { // Add padding if necessary
        decoded += '=';
    }
    return drogon::utils::base64Decode(decoded);
}

std::string JwtManager::generateToken(const Json::Value& payload, long expires_in_seconds) {
    Json::Value header;
    header["alg"] = "HS256";
    header["typ"] = "JWT";

    // Add expiration and issued at times
    auto now = std::chrono::system_clock::now();
    long iat = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch()).count();
    long exp = iat + expires_in_seconds;

    Json::Value claims = payload; // Copy payload to add standard claims
    claims["iat"] = iat;
    claims["exp"] = exp;

    Json::StreamWriterBuilder writer;
    writer["indentation"] = ""; // No indentation for compact JWT

    std::string encodedHeader = base64UrlEncode(Json::writeString(writer, header));
    std::string encodedClaims = base64UrlEncode(Json::writeString(writer, claims));

    std::string signatureInput = encodedHeader + "." + encodedClaims;

    unsigned char* signature = nullptr;
    unsigned int signature_len = 0;

    HMAC_CTX* ctx = HMAC_CTX_new();
    if (!ctx) {
        LOG_ERROR << "Failed to create HMAC_CTX.";
        return "";
    }

    if (1 != HMAC_Init_ex(ctx, secret_key_.c_str(), secret_key_.length(), EVP_sha256(), nullptr)) {
        LOG_ERROR << "HMAC_Init_ex failed.";
        HMAC_CTX_free(ctx);
        return "";
    }
    if (1 != HMAC_Update(ctx, (unsigned char*)signatureInput.c_str(), signatureInput.length())) {
        LOG_ERROR << "HMAC_Update failed.";
        HMAC_CTX_free(ctx);
        return "";
    }

    // Allocate buffer for signature
    signature = (unsigned char*)OPENSSL_malloc(EVP_MAX_MD_SIZE);
    if (!signature) {
        LOG_ERROR << "Failed to allocate memory for signature.";
        HMAC_CTX_free(ctx);
        return "";
    }

    if (1 != HMAC_Final(ctx, signature, &signature_len)) {
        LOG_ERROR << "HMAC_Final failed.";
        OPENSSL_free(signature);
        HMAC_CTX_free(ctx);
        return "";
    }

    HMAC_CTX_free(ctx);

    std::string signatureStr((char*)signature, signature_len);
    OPENSSL_free(signature); // Free the allocated memory

    std::string encodedSignature = base64UrlEncode(signatureStr);

    return encodedHeader + "." + encodedClaims + "." + encodedSignature;
}

std::pair<std::string, std::string> JwtManager::generateTokens(int userId, const std::string& username, const std::vector<std::string>& roles) {
    Json::Value payload;
    payload["userId"] = userId;
    payload["username"] = username;
    
    Json::Value rolesArray(Json::arrayValue);
    for (const auto& role : roles) {
        rolesArray.append(role);
    }
    payload["roles"] = rolesArray;

    std::string accessToken = generateToken(payload, access_token_expiration_seconds_);
    std::string refreshToken = generateToken(payload, refresh_token_expiration_seconds_); // Use same payload, different expiry

    LOG_DEBUG << "Generated new access token for user " << username;
    return {accessToken, refreshToken};
}

std::optional<Json::Value> JwtManager::decodeToken(const std::string& token) {
    size_t firstDot = token.find('.');
    size_t secondDot = token.find('.', firstDot + 1);

    if (firstDot == std::string::npos || secondDot == std::string::npos) {
        LOG_WARN << "Invalid JWT format: missing dots.";
        return std::nullopt;
    }

    std::string encodedHeader = token.substr(0, firstDot);
    std::string encodedClaims = token.substr(firstDot + 1, secondDot - (firstDot + 1));
    std::string encodedSignature = token.substr(secondDot + 1);

    std::string decodedClaimsStr = base64UrlDecode(encodedClaims);
    
    Json::CharReaderBuilder reader;
    Json::Value claims;
    std::string errs;
    std::istringstream s(decodedClaimsStr);
    if (!Json::parseFromStream(reader, s, &claims, &errs)) {
        LOG_WARN << "Failed to parse JWT claims: " << errs;
        return std::nullopt;
    }

    // Verify signature
    std::string signatureInput = encodedHeader + "." + encodedClaims;
    unsigned char expected_signature[EVP_MAX_MD_SIZE];
    unsigned int expected_signature_len = 0;

    HMAC_CTX* ctx = HMAC_CTX_new();
    if (!ctx) {
        LOG_ERROR << "Failed to create HMAC_CTX for verification.";
        return std::nullopt;
    }
    
    if (1 != HMAC_Init_ex(ctx, secret_key_.c_str(), secret_key_.length(), EVP_sha256(), nullptr) ||
        1 != HMAC_Update(ctx, (unsigned char*)signatureInput.c_str(), signatureInput.length()) ||
        1 != HMAC_Final(ctx, expected_signature, &expected_signature_len)) {
        LOG_ERROR << "HMAC verification failed during context operations.";
        HMAC_CTX_free(ctx);
        return std::nullopt;
    }
    HMAC_CTX_free(ctx);

    std::string decodedSignature = base64UrlDecode(encodedSignature);
    if (decodedSignature.length() != expected_signature_len ||
        memcmp(decodedSignature.c_str(), expected_signature, expected_signature_len) != 0) {
        LOG_WARN << "JWT signature mismatch.";
        return std::nullopt;
    }

    // Check expiration
    long exp = claims["exp"].asInt64();
    long now = std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count();

    if (now >= exp) {
        LOG_WARN << "JWT token expired.";
        return std::nullopt;
    }

    return claims;
}

std::optional<Json::Value> JwtManager::verifyAccessToken(const std::string& token) {
    auto claims = decodeToken(token);
    if (claims && claims.value()["exp"].asInt64() >= 
                  std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count() - access_token_expiration_seconds_ ) {
        return claims;
    }
    return std::nullopt;
}

std::optional<Json::Value> JwtManager::verifyRefreshToken(const std::string& token) {
    auto claims = decodeToken(token);
    if (claims && claims.value()["exp"].asInt64() >=
                  std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count() - refresh_token_expiration_seconds_ ) {
        return claims;
    }
    return std::nullopt;
}

} // namespace ApexContent::Utils
```