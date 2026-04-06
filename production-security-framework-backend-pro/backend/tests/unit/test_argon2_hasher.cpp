#include <catch2/catch_all.hpp>
#include "../../src/utils/argon2_hasher.h"

TEST_CASE("Argon2Hasher provides secure password hashing", "[Argon2Hasher][Unit]") {
    Security::Argon2Hasher hasher;

    SECTION("Hashing a password produces a valid Argon2id hash string") {
        std::string password = "mySecurePassword123!";
        std::string hashed_password = hasher.hashPassword(password);

        REQUIRE_FALSE(hashed_password.empty());
        REQUIRE(hashed_password.rfind("$argon2id", 0) == 0); // Starts with $argon2id
        REQUIRE(hashed_password.length() > 60); // Argon2 hashes are typically long
    }

    SECTION("Verifying a correct password returns true") {
        std::string password = "anotherStrongPassword!@#";
        std::string hashed_password = hasher.hashPassword(password);

        REQUIRE(hasher.verifyPassword(password, hashed_password));
    }

    SECTION("Verifying an incorrect password returns false") {
        std::string password = "aWeakPassword";
        std::string hashed_password = hasher.hashPassword(password);
        std::string incorrect_password = "aVeryWeakPassword";

        REQUIRE_FALSE(hasher.verifyPassword(incorrect_password, hashed_password));
    }

    SECTION("Verifying against a malformed hash returns false (or throws, depending on libsodium)") {
        std::string password = "password123";
        std::string malformed_hash = "not_a_valid_hash_string";
        
        // libsodium's crypto_pwhash_str_verify might return -1 for malformed string, 
        // which our wrapper converts to false.
        REQUIRE_FALSE(hasher.verifyPassword(password, malformed_hash));
    }
    
    SECTION("Empty password hashing and verification") {
        std::string empty_password = "";
        std::string hashed_empty = hasher.hashPassword(empty_password);
        REQUIRE_FALSE(hashed_empty.empty());
        REQUIRE(hasher.verifyPassword(empty_password, hashed_empty));
        REQUIRE_FALSE(hasher.verifyPassword("non_empty", hashed_empty));
    }
}