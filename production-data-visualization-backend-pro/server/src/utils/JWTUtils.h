#pragma once

#include <string>
#include <vector>
#include <map>
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <nlohmann/json.hpp>
#include "common/Constants.h"
#include "utils/Logger.h"

namespace DataVizPro {
namespace JWTUtils {

// Base64 encode/decode utilities (simplified for brevity, often from a lib)
inline std::string base64_encode(const std::string& in) {
    BIO *b64 = BIO_new(BIO_f_base64());
    BIO *mem = BIO_new(BIO_s_mem());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL); // No newlines
    BIO_push(b64, mem);
    BIO_write(b64, in.data(), in.length());
    BIO_flush(b64);

    char *buffer;
    long len = BIO_get_mem_data(mem, &buffer);
    std::string out(buffer, len);

    BIO_free_all(b64);
    return out;
}

inline std::string base64_decode(const std::string& in) {
    BIO *b64 = BIO_new(BIO_f_base64());
    BIO *mem = BIO_new_mem_buf(in.data(), in.length());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL); // No newlines
    BIO_push(b64, mem);

    std::vector<char> buffer(in.length()); // Max possible size
    int decoded_len = BIO_read(b64, buffer.data(), buffer.size());

    BIO_free_all(b64);
    if (decoded_len < 0) return "";
    return std::string(buffer.data(), decoded_len);
}

// HMAC-SHA256 signature
inline std::string hmac_sha256(const std::string& key, const std::string& msg) {
    unsigned char* digest = HMAC(EVP_sha256(), key.c_str(), key.length(),
                                 (const unsigned char*)msg.c_str(), msg.length(), NULL, NULL);
    char mdString[65];
    for(int i = 0; i < 32; i++)
         sprintf(&mdString[i*2], "%02x", (unsigned int)digest[i]);
    return std::string(mdString);
}


inline std::string generateToken(const std::string& userId, const std::string& username) {
    nlohmann::json header = {
        {"alg", "HS256"},
        {"typ", "JWT"}
    };
    nlohmann::json payload = {
        {"userId", userId},
        {"username", username},
        {"exp", std::chrono::system_clock::to_time_t(std::chrono::system_clock::now() + std::chrono::hours(24))} // 24-hour expiration
    };

    std::string encodedHeader = base64_encode(header.dump());
    std::string encodedPayload = base64_encode(payload.dump());
    std::string signatureInput = encodedHeader + "." + encodedPayload;

    std::string signature = hmac_sha256(Constants::JWT_SECRET, signatureInput);
    std::string encodedSignature = base64_encode(signature); // Base64 encode the hex string

    return encodedHeader + "." + encodedPayload + "." + encodedSignature;
}

inline nlohmann::json verifyToken(const std::string& token) {
    size_t firstDot = token.find('.');
    size_t secondDot = token.find('.', firstDot + 1);

    if (firstDot == std::string::npos || secondDot == std::string::npos) {
        LOG_WARN("Invalid JWT format: missing dots.");
        return {}; // Invalid format
    }

    std::string encodedHeader = token.substr(0, firstDot);
    std::string encodedPayload = token.substr(firstDot + 1, secondDot - (firstDot + 1));
    std::string encodedSignature = token.substr(secondDot + 1);

    std::string signatureInput = encodedHeader + "." + encodedPayload;
    std::string expectedSignatureHex = hmac_sha256(Constants::JWT_SECRET, signatureInput);
    std::string expectedEncodedSignature = base64_encode(expectedSignatureHex);

    if (expectedEncodedSignature != encodedSignature) {
        LOG_WARN("JWT verification failed: signature mismatch.");
        return {}; // Signature mismatch
    }

    std::string decodedPayload = base64_decode(encodedPayload);
    try {
        nlohmann::json payload = nlohmann::json::parse(decodedPayload);
        if (payload.contains("exp")) {
            long long exp_timestamp = payload["exp"].get<long long>();
            if (std::chrono::system_clock::now() > std::chrono::system_clock::from_time_t(exp_timestamp)) {
                LOG_WARN("JWT verification failed: token expired.");
                return {}; // Token expired
            }
        }
        return payload;
    } catch (const nlohmann::json::parse_error& e) {
        LOG_ERROR("Failed to parse JWT payload: {}", e.what());
        return {}; // Payload not valid JSON
    }
}

} // namespace JWTUtils
} // namespace DataVizPro
```