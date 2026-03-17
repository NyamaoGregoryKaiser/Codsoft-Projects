#include <gtest/gtest.h>
#include "utils/PasswordHasher.h"
#include <string>

// Mock bcrypt functions for unit testing PasswordHasher if not linking a real lib
// In a real build, we'd link to libbcrypt and not mock it.
// For demonstration, these are simplified mocks.
extern "C" {
    char* bcrypt_gensalt(int rounds, char* salt) {
        if (rounds < 4 || rounds > 31) return nullptr;
        // Simple mock salt
        strcpy(salt, "$2a$10$abcdefghijklmnopqrstuvwx");
        return salt;
    }
    char* bcrypt_hashpw(const char* password, const char* salt, char* hashed) {
        // Very basic mock hashing: combines password and salt
        std::string mock_hash = std::string(salt) + std::string("_") + password;
        if (mock_hash.length() >= 100) return nullptr; // Exceeds buffer
        strcpy(hashed, mock_hash.c_str());
        return hashed;
    }
    int bcrypt_checkpw(const char* password, const char* hashed) {
        // For mock, verify by reversing the mock_hash logic
        std::string hashed_str(hashed);
        size_t pos = hashed_str.find('_');
        if (pos == std::string::npos) return 1; // Not a mock hash

        std::string salt_part = hashed_str.substr(0, pos);
        std::string password_part = hashed_str.substr(pos + 1);

        if (password_part == password) {
            // Check salt part too (should match the one used to create hash)
            // For real bcrypt, it's just a verification call.
            // With this mock, we ensure it looks like a valid mock hash structure.
            if (salt_part.length() > 0 && salt_part[0] == '$') return 0; // Success
        }
        return 1; // Failure
    }
}

TEST(PasswordHasherTest, HashAndVerifyCorrectPassword) {
    std::string password = "mysecretpassword";
    std::string hashedPassword = PasswordHasher::hashPassword(password);

    ASSERT_FALSE(hashedPassword.empty());
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword));
}

TEST(PasswordHasherTest, VerifyIncorrectPassword) {
    std::string password = "mysecretpassword";
    std::string hashedPassword = PasswordHasher::hashPassword(password);
    std::string incorrectPassword = "wrongpassword";

    ASSERT_FALSE(PasswordHasher::verifyPassword(incorrectPassword, hashedPassword));
}

TEST(PasswordHasherTest, HashWithDifferentRounds) {
    std::string password = "anothersecret";
    std::string hashedPassword10 = PasswordHasher::hashPassword(password, 10);
    std::string hashedPassword12 = PasswordHasher::hashPassword(password, 12);

    ASSERT_FALSE(hashedPassword10.empty());
    ASSERT_FALSE(hashedPassword12.empty());
    ASSERT_NE(hashedPassword10, hashedPassword12); // Different salts/cost factors
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword10));
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword12));
}

TEST(PasswordHasherTest, EmptyPasswordHandling) {
    std::string emptyPassword = "";
    std::string hashedPassword = PasswordHasher::hashPassword(emptyPassword);
    ASSERT_TRUE(hashedPassword.empty()); // Should return empty on invalid input

    std::string validPassword = "valid_password";
    std::string validHashed = PasswordHasher::hashPassword(validPassword);
    ASSERT_FALSE(PasswordHasher::verifyPassword(emptyPassword, validHashed)); // Should fail for empty password
}

TEST(PasswordHasherTest, EmptyHashedPasswordHandling) {
    std::string password = "test_password";
    std::string emptyHashedPassword = "";
    ASSERT_FALSE(PasswordHasher::verifyPassword(password, emptyHashedPassword));
}

TEST(PasswordHasherTest, NullOrInvalidInputs) {
    // In C++, passing nullptr for std::string parameters isn't directly possible
    // but empty strings should be handled robustly.
    ASSERT_FALSE(PasswordHasher::verifyPassword("password", "invalid_hash_format"));
    ASSERT_FALSE(PasswordHasher::verifyPassword("password", "$2a$10$short_hash")); // Too short/invalid mock hash
}

// Ensure the mock works as expected (if these were real bcrypt, it would be a real test)
TEST(PasswordHasherTest, MockBcryptBehavior) {
    char salt[60];
    char hashed[100];
    const char* password = "test_password";

    bcrypt_gensalt(10, salt);
    ASSERT_STRNE(salt, ""); // Salt should be generated

    bcrypt_hashpw(password, salt, hashed);
    ASSERT_STRNE(hashed, ""); // Hash should be generated

    ASSERT_EQ(bcrypt_checkpw(password, hashed), 0); // Correct password
    ASSERT_NE(bcrypt_checkpw("wrong_password", hashed), 0); // Incorrect password
}
```