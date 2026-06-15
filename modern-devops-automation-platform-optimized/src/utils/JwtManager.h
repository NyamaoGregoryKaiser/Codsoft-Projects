```cpp
#pragma once

#include <string>
#include <chrono>
#include <map>
#include <Poco/JSON/Object.h>

namespace AppUtils {

// This is a conceptual JWT manager.
// In a real application, you'd use a robust library like jwt-cpp or similar.
// This simplified version demonstrates the interface.
class JwtManager {
public:
    static JwtManager& getInstance();

    void initialize(const std::string& secret, int expiryMinutes);

    // Generate a JWT token
    // claims: map of string key to string value for payload
    std::string generateToken(const std::map<std::string, std::string>& claims) const;

    // Verify a JWT token and return its payload if valid
    // Returns a JSON object pointer on success, nullptr on failure
    Poco::JSON::Object::Ptr verifyToken(const std::string& token) const;

private:
    JwtManager() = default;
    JwtManager(const JwtManager&) = delete;
    JwtManager& operator=(const JwtManager&) = delete;

    std::string secret_;
    int expiryMinutes_;

    // Helper for base64 encoding (simplified)
    std::string base64Encode(const std::string& in) const;
    // Helper for base64 decoding (simplified)
    std::string base64Decode(const std::string& in) const;
    // Helper for HMAC-SHA256 signature (simplified)
    std::string hmacSha256(const std::string& key, const std::string& msg) const;

    // A real JWT implementation would involve proper cryptographic functions.
    // These are placeholders.
};

} // namespace AppUtils
```