```cpp
#include <gtest/gtest.h>
#include "../../src/services/ProductService.h"
#include "../../src/database/DbClient.h"
#include "../../src/config/AppConfig.h"
#include "../../src/utils/Logger.h"
#include "../../src/utils/Cache.h"
#include "../../src/utils/JwtManager.h"
#include <drogon/drogon.h>
#include <future> // For std::promise/future with async operations
#include <uuid/uuid.h> // For UUID generation

// Test fixture for database integration tests
class DbIntegrationTest : public ::testing::Test {
protected:
    AppServices::ProductService service;
    std::string testProductId;

    void SetUp() override {
        // Ensure Drogon's event loop is running for async operations
        if (!drogon::app().isRunning()) {
            drogon::app().loadConfigFile("config/app_config.json");
            drogon::app().enableSession(0); // Disable sessions for testing
            drogon::app().setLogPath("./test_logs");
            drogon::app().setLogLevel(trantor::Logger::kDebug);
            drogon::app().setThreadNum(1); // Single thread for tests to avoid race conditions
            drogon::app().enableHttps(false);
            drogon::app().addListener("127.0.0.1", 8080); // Just needs a port to listen on for running
            // Start the application in a separate thread so tests can block and wait.
            // This is a common pattern for testing Drogon.
            std::thread([](){ drogon::app().run(); }).detach();
            while(!drogon::app().isRunning()){
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        }

        // Initialize AppConfig
        AppConfig::ConfigManager::getInstance().loadConfig("config/app_config.json");
        const auto& dbConfig = AppConfig::ConfigManager::getInstance().getDatabaseConfig();
        const auto& jwtConfig = AppConfig::ConfigManager::getInstance().getJwtConfig();

        // Initialize Logger
        AppUtils::Logger::init("DEBUG");

        // Initialize DbClient (actual DB connection)
        AppDb::DbClient::getInstance().initialize(
            dbConfig.host, dbConfig.port, dbConfig.user, dbConfig.password, dbConfig.dbname, 1 // Small pool for tests
        );

        // Initialize JWT Manager
        AppUtils::JwtManager::getInstance().initialize(jwtConfig.secret, jwtConfig.expiryMinutes);

        // Clear cache before each test
        AppUtils::Cache::getInstance().clear();

        // Clean up any previous test data
        drogon::orm::Result result = AppDb::DbClient::getInstance().client().execSqlSync("DELETE FROM products WHERE name LIKE 'TestProduct-%'");
        LOG_INFO << "Cleaned up " << result.affectedRows() << " test products.";

        // Generate unique product ID for testing
        uuid_t uuid;
        uuid_generate_random(uuid);
        char uuid_str[37];
        uuid_unparse_lower(uuid, uuid_str);
        testProductId = uuid_str;
    }

    void TearDown() override {
        // Clean up test data after each test
        drogon::orm::Result result = AppDb::DbClient::getInstance().client().execSqlSync("DELETE FROM products WHERE name LIKE 'TestProduct-%' OR id = $1", testProductId);
        LOG_INFO << "TearDown: Cleaned up " << result.affectedRows() << " test products.";
    }

    // Helper to run async tasks and wait for them in a test
    template<typename F>
    auto runAsyncAndGet(F func) {
        std::promise<decltype(func().get())> p;
        auto f = p.get_future();
        drogon::app().getLoop()->runInLoop([&, func = std::move(func)]() mutable {
            func().then([&p](auto&& res) {
                p.set_value(std::forward<decltype(res)>(res));
            }).except([&p](const std::exception& e) {
                p.set_exception(std::current_exception());
            });
        });
        return f.get(); // Block until result is ready
    }
};

// Test: Product creation
TEST_F(DbIntegrationTest, CreateProduct_Success) {
    Poco::JSON::Object::Ptr productJson = new Poco::JSON::Object();
    productJson->set("name", "TestProduct-Create-" + testProductId);
    productJson->set("description", "A product for creation test.");
    productJson->set("price", 19.99);
    productJson->set("stock", 10);
    productJson->set("category", "TestCategory");

    AppModels::Product createdProduct = runAsyncAndGet([&](){ return service.createProduct(productJson); });

    ASSERT_EQ(createdProduct.name, "TestProduct-Create-" + testProductId);
    ASSERT_EQ(createdProduct.price, 19.99);
    ASSERT_EQ(createdProduct.stock, 10);
    ASSERT_FALSE(createdProduct.id.empty());
}

// Test: Get product by ID
TEST_F(DbIntegrationTest, GetProductById_Success) {
    // First, create a product
    Poco::JSON::Object::Ptr createJson = new Poco::JSON::Object();
    createJson->set("name", "TestProduct-GetById-" + testProductId);
    createJson->set("description", "A product for get by ID test.");
    createJson->set("price", 29.99);
    createJson->set("stock", 20);
    createJson->set("category", "TestCategory");

    AppModels::Product createdProduct = runAsyncAndGet([&](){ return service.createProduct(createJson); });

    // Then, retrieve it
    std::optional<AppModels::Product> fetchedProduct = runAsyncAndGet([&](){ return service.getProductById(createdProduct.id); });

    ASSERT_TRUE(fetchedProduct.has_value());
    ASSERT_EQ(fetchedProduct->id, createdProduct.id);
    ASSERT_EQ(fetchedProduct->name, createdProduct.name);
}

// Test: Get product by ID - Not Found
TEST_F(DbIntegrationTest, GetProductById_NotFound) {
    std::optional<AppModels::Product> fetchedProduct = runAsyncAndGet([&](){ return service.getProductById("non-existent-id"); });
    ASSERT_FALSE(fetchedProduct.has_value());
}

// Test: Update product
TEST_F(DbIntegrationTest, UpdateProduct_Success) {
    // First, create a product
    Poco::JSON::Object::Ptr createJson = new Poco::JSON::Object();
    createJson->set("name", "TestProduct-Update-" + testProductId);
    createJson->set("description", "A product for update test.");
    createJson->set("price", 39.99);
    createJson->set("stock", 30);
    createJson->set("category", "TestCategory");
    AppModels::Product createdProduct = runAsyncAndGet([&](){ return service.createProduct(createJson); });

    // Then, update it
    Poco::JSON::Object::Ptr updateJson = new Poco::JSON::Object();
    updateJson->set("price", 49.99);
    updateJson->set("stock", 40);

    std::optional<AppModels::Product> updatedProduct = runAsyncAndGet([&](){ return service.updateProduct(createdProduct.id, updateJson); });

    ASSERT_TRUE(updatedProduct.has_value());
    ASSERT_EQ(updatedProduct->id, createdProduct.id);
    ASSERT_EQ(updatedProduct->price, 49.99);
    ASSERT_EQ(updatedProduct->stock, 40);
}

// Test: Delete product
TEST_F(DbIntegrationTest, DeleteProduct_Success) {
    // First, create a product
    Poco::JSON::Object::Ptr createJson = new Poco::JSON::Object();
    createJson->set("name", "TestProduct-Delete-" + testProductId);
    createJson->set("description", "A product for delete test.");
    createJson->set("price", 59.99);
    createJson->set("stock", 50);
    createJson->set("category", "TestCategory");
    AppModels::Product createdProduct = runAsyncAndGet([&](){ return service.createProduct(createJson); });

    // Then, delete it
    bool deleted = runAsyncAndGet([&](){ return service.deleteProduct(createdProduct.id); });
    ASSERT_TRUE(deleted);

    // Verify it's gone
    std::optional<AppModels::Product> fetchedProduct = runAsyncAndGet([&](){ return service.getProductById(createdProduct.id); });
    ASSERT_FALSE(fetchedProduct.has_value());
}

// Test: Authentication (simplified)
TEST_F(DbIntegrationTest, AuthenticateUser_Success) {
    std::optional<std::string> token = runAsyncAndGet([&](){ return service.authenticateUser("admin", "adminpass"); });
    ASSERT_TRUE(token.has_value());
    ASSERT_FALSE(token->empty());

    // Verify token content (conceptual)
    Poco::JSON::Object::Ptr payload = AppUtils::JwtManager::getInstance().verifyToken(*token);
    ASSERT_TRUE(payload.get() != nullptr);
    ASSERT_TRUE(payload->has("userId"));
    ASSERT_EQ(payload->getValue<std::string>("username"), "admin");
    ASSERT_EQ(payload->getValue<std::string>("isAdmin"), "true");
}

TEST_F(DbIntegrationTest, AuthenticateUser_Failure_WrongPassword) {
    std::optional<std::string> token = runAsyncAndGet([&](){ return service.authenticateUser("admin", "wrongpass"); });
    ASSERT_FALSE(token.has_value());
}

TEST_F(DbIntegrationTest, AuthenticateUser_Failure_UserNotFound) {
    std::optional<std::string> token = runAsyncAndGet([&](){ return service.authenticateUser("nonexistentuser", "anypass"); });
    ASSERT_FALSE(token.has_value());
}
```