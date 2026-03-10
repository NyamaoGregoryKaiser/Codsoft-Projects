```cpp
#include "gtest/gtest.h"
#include "../../src/core/Cache.h"
#include "../../src/utils/Types.h"
#include "../../src/utils/Logger.h"

using namespace mlops;
using namespace mlops::core;
using namespace mlops::utils;

// Helper to set up dummy logger for tests
struct GlobalTestSetup {
    GlobalTestSetup() {
        Logger::getInstance().init("/dev/null", LogLevel::ERROR); // Suppress log output during tests
    }
};

GlobalTestSetup g_test_setup_cache;

ModelVersionDTO createDummyVersion(int id, int model_id, const std::string& tag) {
    ModelVersionDTO dto;
    dto.id = id;
    dto.model_id = model_id;
    dto.version_tag = tag;
    dto.model_path = "/path/to/model_" + std::to_string(id);
    dto.created_at = getCurrentTimestamp();
    dto.is_active = true;
    dto.parameters = {{"paramA", 1.0 * id}};
    dto.notes = "Test version " + tag;
    return dto;
}

TEST(ModelVersionCacheTest, PutAndGet) {
    ModelVersionCache cache(2);
    ModelVersionDTO v1 = createDummyVersion(1, 100, "v1.0");
    ModelVersionDTO v2 = createDummyVersion(2, 100, "v2.0");

    cache.put(v1);
    cache.put(v2);

    std::optional<ModelVersionDTO> retrieved_v1 = cache.get(1);
    ASSERT_TRUE(retrieved_v1.has_value());
    ASSERT_EQ(*retrieved_v1->id, 1);
    ASSERT_EQ(retrieved_v1->version_tag, "v1.0");

    std::optional<ModelVersionDTO> retrieved_v2 = cache.get(2);
    ASSERT_TRUE(retrieved_v2.has_value());
    ASSERT_EQ(*retrieved_v2->id, 2);
}

TEST(ModelVersionCacheTest, LRUEviction) {
    ModelVersionCache cache(2);
    ModelVersionDTO v1 = createDummyVersion(1, 100, "v1.0");
    ModelVersionDTO v2 = createDummyVersion(2, 100, "v2.0");
    ModelVersionDTO v3 = createDummyVersion(3, 101, "v3.0");

    cache.put(v1); // v1
    cache.put(v2); // v2, v1 (v1 is LRU)

    ASSERT_EQ(cache.size(), 2);
    ASSERT_TRUE(cache.get(1).has_value()); // v1, v2 (v2 is LRU)

    cache.put(v3); // v3, v1 (v2 should be evicted)
    ASSERT_EQ(cache.size(), 2);
    ASSERT_FALSE(cache.get(2).has_value()); // v2 should be gone
    ASSERT_TRUE(cache.get(1).has_value());
    ASSERT_TRUE(cache.get(3).has_value());
}

TEST(ModelVersionCacheTest, UpdateExisting) {
    ModelVersionCache cache(2);
    ModelVersionDTO v1 = createDummyVersion(1, 100, "v1.0");
    cache.put(v1);

    ModelVersionDTO v1_updated = createDummyVersion(1, 100, "v1.0-updated");
    v1_updated.notes = "Updated notes";
    cache.put(v1_updated); // Should update v1, not add a new entry

    ASSERT_EQ(cache.size(), 1);
    std::optional<ModelVersionDTO> retrieved = cache.get(1);
    ASSERT_TRUE(retrieved.has_value());
    ASSERT_EQ(retrieved->version_tag, "v1.0-updated");
    ASSERT_EQ(retrieved->notes, "Updated notes");
}

TEST(ModelVersionCacheTest, RemoveItem) {
    ModelVersionCache cache(2);
    ModelVersionDTO v1 = createDummyVersion(1, 100, "v1.0");
    ModelVersionDTO v2 = createDummyVersion(2, 100, "v2.0");
    cache.put(v1);
    cache.put(v2);

    ASSERT_EQ(cache.size(), 2);
    cache.remove(1);
    ASSERT_EQ(cache.size(), 1);
    ASSERT_FALSE(cache.get(1).has_value());
    ASSERT_TRUE(cache.get(2).has_value());

    cache.remove(2);
    ASSERT_EQ(cache.size(), 0);
    ASSERT_FALSE(cache.get(2).has_value());
}

TEST(ModelVersionCacheTest, GetNonExistent) {
    ModelVersionCache cache(2);
    std::optional<ModelVersionDTO> retrieved = cache.get(99);
    ASSERT_FALSE(retrieved.has_value());
}

TEST(ModelVersionCacheTest, ClearCache) {
    ModelVersionCache cache(2);
    cache.put(createDummyVersion(1, 100, "v1"));
    cache.put(createDummyVersion(2, 100, "v2"));
    ASSERT_EQ(cache.size(), 2);

    cache.clear();
    ASSERT_EQ(cache.size(), 0);
    ASSERT_FALSE(cache.get(1).has_value());
    ASSERT_FALSE(cache.get(2).has_value());
}

TEST(ModelVersionCacheTest, PutWithoutId) {
    ModelVersionCache cache(1);
    ModelVersionDTO v_no_id;
    v_no_id.model_id = 1;
    v_no_id.version_tag = "no_id";
    // id is std::optional, will be default empty
    cache.put(v_no_id);
    ASSERT_EQ(cache.size(), 0); // Should not add to cache if ID is missing
}
```