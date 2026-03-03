```cpp
#include <gtest/gtest.h>
#include "src/utils/PasswordHasher.h"
#include "src/utils/Logger.h" // Include for proper compilation/logging setup

// Initialize logger for tests
struct GlobalTestSetup {
    GlobalTestSetup() {
        ApexContent::Utils::Logger::init();
    }
};
GlobalTestSetup g_test_setup;


TEST(PasswordHasherTest, HashAndVerifyCorrectPassword) {
    std::string password = "mySecurePassword123";
    auto [hash, salt] = ApexContent::Utils::PasswordHasher::hashPassword(password);

    ASSERT_FALSE(hash.empty());
    ASSERT_FALSE(salt.empty());

    bool is_valid = ApexContent::Utils::PasswordHasher::verifyPassword(password, hash, salt);
    ASSERT_TRUE(is_valid);
}

TEST(PasswordHasherTest, VerifyIncorrectPassword) {
    std::string password = "mySecurePassword123";
    std::string wrongPassword = "wrongPassword";
    auto [hash, salt] = ApexContent::Utils::PasswordHasher::hashPassword(password);

    bool is_valid = ApexContent::Utils::PasswordHasher::verifyPassword(wrongPassword, hash, salt);
    ASSERT_FALSE(is_valid);
}

TEST(PasswordHasherTest, DifferentSaltsProduceDifferentHashes) {
    std::string password = "mySecurePassword123";
    auto [hash1, salt1] = ApexContent::Utils::PasswordHasher::hashPassword(password);
    auto [hash2, salt2] = ApexContent::Utils::PasswordHasher::hashPassword(password);

    ASSERT_NE(salt1, salt2); // Salts should be different
    ASSERT_NE(hash1, hash2); // Hashes should be different due to different salts
}

TEST(PasswordHasherTest, VerifyWithWrongSalt) {
    std::string password = "mySecurePassword123";
    auto [hash, salt] = ApexContent::Utils::PasswordHasher::hashPassword(password);
    
    std::string wrongSalt = "incorrectsalt12345"; // Needs to be long enough
    ASSERT_NE(salt, wrongSalt);

    bool is_valid = ApexContent::Utils::PasswordHasher::verifyPassword(password, hash, wrongSalt);
    ASSERT_FALSE(is_valid);
}
```