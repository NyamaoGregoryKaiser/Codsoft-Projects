```cpp
#include <gtest/gtest.h>
#include "app/services/ProjectService.h"
#include "core/database/DatabaseManager.h"
#include "app/services/AuthService.h" // For creating test users
#include "core/utils/Logger.h" // For Logger::init
#include "core/utils/Config.h" // For Config::load

// Global setup for tests, runs once for all tests
class ProjectServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Initialize config and logger once
        static bool initialized = false;
        if (!initialized) {
            Config::load("config.json"); // Load a dummy or actual config
            Logger::init(Config::get("log_config_path", "config/log_config.json"));
            initialized = true;
        }

        // Initialize SQLite in-memory database for testing
        // This ensures a clean slate for each test suite
        DatabaseManager::init("sqlite3::memory:");

        // Apply schema migrations to the in-memory database
        DatabaseManager::execute(
            "CREATE TABLE users ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) NOT NULL UNIQUE, "
            "email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, "
            "created_at TEXT, updated_at TEXT);"
        );
        DatabaseManager::execute(
            "CREATE TABLE projects ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255) NOT NULL, "
            "description TEXT, owner_id INTEGER NOT NULL, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE);"
        );
        DatabaseManager::execute(
            "CREATE TABLE tasks ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255) NOT NULL, "
            "description TEXT, project_id INTEGER NOT NULL, assigned_user_id INTEGER NOT NULL, "
            "status VARCHAR(50) NOT NULL DEFAULT 'OPEN', due_date TEXT, "
            "created_at TEXT, updated_at TEXT, "
            "FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, "
            "FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE);"
        );

        // Create a test user for projects
        testUser = AuthService::registerUser("testuser_project", "project@example.com", "password123");
        testUserId = *testUser.id;
    }

    void TearDown() override {
        // Database will be reset for next test suite by re-initializing in-memory DB
        // No explicit cleanup needed for in-memory DB
    }

    User testUser;
    long long testUserId;
};

TEST_F(ProjectServiceTest, CreateProject) {
    Project project_data;
    project_data.name = "Test Project";
    project_data.description = "A project for testing.";

    Project created_project = ProjectService::createProject(project_data, testUserId);

    ASSERT_TRUE(created_project.id.has_value());
    ASSERT_EQ(created_project.name, project_data.name);
    ASSERT_EQ(created_project.description, project_data.description);
    ASSERT_EQ(created_project.owner_id, testUserId);
    ASSERT_FALSE(created_project.created_at.empty());
    ASSERT_FALSE(created_project.updated_at.empty());
}

TEST_F(ProjectServiceTest, GetProjectById) {
    Project project_data;
    project_data.name = "Another Project";
    project_data.description = "Description for another project.";
    Project created_project = ProjectService::createProject(project_data, testUserId);

    std::optional<Project> fetched_project = ProjectService::getProjectById(*created_project.id, testUserId);
    ASSERT_TRUE(fetched_project.has_value());
    ASSERT_EQ(fetched_project->id, created_project.id);
    ASSERT_EQ(fetched_project->name, created_project.name);
    ASSERT_EQ(fetched_project->owner_id, testUserId);

    // Test with non-existent ID
    std::optional<Project> not_found_project = ProjectService::getProjectById(9999, testUserId);
    ASSERT_FALSE(not_found_project.has_value());

    // Test with wrong user ID
    User otherUser = AuthService::registerUser("otheruser", "other@example.com", "password123");
    std::optional<Project> wrong_owner_project = ProjectService::getProjectById(*created_project.id, *otherUser.id);
    ASSERT_FALSE(wrong_owner_project.has_value());
}

TEST_F(ProjectServiceTest, GetAllProjects) {
    Project project1_data;
    project1_data.name = "Project One"; project1_data.description = "Desc One";
    ProjectService::createProject(project1_data, testUserId);

    Project project2_data;
    project2_data.name = "Project Two"; project2_data.description = "Desc Two";
    ProjectService::createProject(project2_data, testUserId);

    std::vector<Project> projects = ProjectService::getAllProjects(testUserId);
    ASSERT_EQ(projects.size(), 2);

    // Verify projects belong to testUserId
    for (const auto& p : projects) {
        ASSERT_EQ(p.owner_id, testUserId);
    }
}

TEST_F(ProjectServiceTest, UpdateProject) {
    Project project_data;
    project_data.name = "Old Name";
    project_data.description = "Old Description";
    Project created_project = ProjectService::createProject(project_data, testUserId);

    Project update_data;
    update_data.name = "New Name";
    update_data.description = "New Description";

    std::optional<Project> updated_project = ProjectService::updateProject(*created_project.id, update_data, testUserId);
    ASSERT_TRUE(updated_project.has_value());
    ASSERT_EQ(updated_project->name, "New Name");
    ASSERT_EQ(updated_project->description, "New Description");
    ASSERT_TRUE(updated_project->updated_at > created_project.updated_at); // updated_at should change

    // Try updating with missing fields (should retain old values)
    Project partial_update_data;
    partial_update_data.name = "Partial Update";
    std::optional<Project> partially_updated = ProjectService::updateProject(*created_project.id, partial_update_data, testUserId);
    ASSERT_TRUE(partially_updated.has_value());
    ASSERT_EQ(partially_updated->name, "Partial Update");
    ASSERT_EQ(partially_updated->description, "New Description"); // description should remain unchanged

    // Try updating non-existent project
    std::optional<Project> non_existent_update = ProjectService::updateProject(9999, update_data, testUserId);
    ASSERT_FALSE(non_existent_update.has_value());

    // Try updating project not owned by user
    User otherUser = AuthService::registerUser("unauthorized", "unauth@example.com", "pass");
    std::optional<Project> unauthorized_update = ProjectService::updateProject(*created_project.id, update_data, *otherUser.id);
    ASSERT_FALSE(unauthorized_update.has_value());
}

TEST_F(ProjectServiceTest, DeleteProject) {
    Project project_data;
    project_data.name = "Project to Delete";
    project_data.description = "This will be deleted.";
    Project created_project = ProjectService::createProject(project_data, testUserId);

    bool deleted = ProjectService::deleteProject(*created_project.id, testUserId);
    ASSERT_TRUE(deleted);

    std::optional<Project> fetched_after_delete = ProjectService::getProjectById(*created_project.id, testUserId);
    ASSERT_FALSE(fetched_after_delete.has_value());

    // Try deleting non-existent project
    bool non_existent_delete = ProjectService::deleteProject(9999, testUserId);
    ASSERT_FALSE(non_existent_delete);

    // Try deleting project not owned by user
    Project project_by_other_user;
    project_by_other_user.name = "Other User Project";
    project_by_other_user.description = "Belongs to another user.";
    User otherUser = AuthService::registerUser("deleter", "deleter@example.com", "pass");
    Project created_by_other = ProjectService::createProject(project_by_other_user, *otherUser.id);

    bool unauthorized_delete = ProjectService::deleteProject(*created_by_other.id, testUserId); // testUserId tries to delete otherUser's project
    ASSERT_FALSE(unauthorized_delete);

    // Verify it still exists
    std::optional<Project> still_exists = ProjectService::getProjectById(*created_by_other.id, *otherUser.id);
    ASSERT_TRUE(still_exists.has_value());
}
```