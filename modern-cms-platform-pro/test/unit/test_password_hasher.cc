#include <gtest/gtest.h>
#include "utils/PasswordHasher.h" // Assuming it points to the mock or real bcrypt

TEST(PasswordHasherTest, HashAndVerifyPassword) {
    std::string password = "mySecurePassword123";
    std::string hashedPassword = PasswordHasher::hashPassword(password);

    // In a real bcrypt scenario, the hash should start with $2a$ or $2b$ and have a specific length
    // For our mock, we expect a specific value or format.
#ifdef USE_MOCK_BCRYPT
    // With mock, the hash is not truly random, but it should be non-empty and specific enough for the mock logic.
    // Given the mock always hashes "password123" to a fixed string for verify, we will test with that.
    std::string testPassword = "password123";
    std::string testHashedPassword = PasswordHasher::hashPassword(testPassword); // This will return a mock hash
    ASSERT_FALSE(testHashedPassword.empty());
    ASSERT_TRUE(PasswordHasher::verifyPassword(testPassword, "$2a$10$p0VbT9Xp1B.w.m.Z0Y.7I.b/v4k.N5E6F7G8H9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z"));
    ASSERT_FALSE(PasswordHasher::verifyPassword("wrongpassword", "$2a$10$p0VbT9Xp1B.w.m.Z0Y.7I.b/v4k.N5E6F7G8H9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z"));
#else
    // For a real bcrypt library:
    ASSERT_FALSE(hashedPassword.empty());
    ASSERT_NE(password, hashedPassword); // Hash should not be plain text
    ASSERT_TRUE(PasswordHasher::verifyPassword(password, hashedPassword));
    ASSERT_FALSE(PasswordHasher::verifyPassword("wrongpassword", hashedPassword));
#endif
}

TEST(PasswordHasherTest, VerifyWrongPassword) {
    std::string password = "testpassword";
    std::string hashedPassword = "$2a$10$p0VbT9Xp1B.w.m.Z0Y.7I.b/v4k.N5E6F7G8H9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z"; // Example hash for 'password123'

    ASSERT_FALSE(PasswordHasher::verifyPassword("incorrect", hashedPassword));
}