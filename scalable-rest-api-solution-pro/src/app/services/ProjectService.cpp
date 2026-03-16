```cpp
#include "ProjectService.h"
#include "core/database/DatabaseManager.h"
#include "core/utils/Logger.h"
#include <chrono>
#include <iomanip>
#include <sstream>
#include <stdexcept>

std::vector<Project> ProjectService::getAllProjects(long long user_id) {
    soci::session& sql = DatabaseManager::getSession();
    std::vector<Project> projects;

    try {
        soci::statement st = (sql.prepare << "SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE owner_id = :owner_id",
            soci::use(user_id));

        st.execute();

        long long id;
        std::string name, description, created_at, updated_at;
        long long owner_id_db;

        while (st.fetch()) {
            projects.emplace_back(id, name, description, owner_id_db, created_at, updated_at);
        }
        Logger::info("Fetched {} projects for user_id: {}", projects.size(), user_id);
        return projects;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error fetching all projects for user_id {}: {}", user_id, e.what());
        throw std::runtime_error("Failed to fetch projects. Database error.");
    }
}

std::optional<Project> ProjectService::getProjectById(long long project_id, long long user_id) {
    soci::session& sql = DatabaseManager::getSession();
    Project project;
    long long id_val; // Use temporary variable for optional
    std::string name_val, description_val, created_at_val, updated_at_val;
    long long owner_id_val;

    try {
        sql << "SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id = :id AND owner_id = :owner_id",
            soci::into(id_val), soci::into(name_val), soci::into(description_val), soci::into(owner_id_val),
            soci::into(created_at_val), soci::into(updated_at_val),
            soci::use(project_id), soci::use(user_id);

        project.id = id_val;
        project.name = name_val;
        project.description = description_val;
        project.owner_id = owner_id_val;
        project.created_at = created_at_val;
        project.updated_at = updated_at_val;

        Logger::info("Fetched project with ID {} for user_id: {}", project_id, user_id);
        return project;
    } catch (const soci::soci_error& e) {
        if (e.get_error_code() == soci::sqlite3 && std::string(e.what()).find("No data fetched") != std::string::npos) {
            Logger::warn("Project not found with ID {} for user_id {}.", project_id, user_id);
            return std::nullopt;
        }
        Logger::error("Database error fetching project by ID {}: {}", project_id, e.what());
        throw std::runtime_error("Failed to fetch project. Database error.");
    }
}

Project ProjectService::createProject(const Project& project, long long owner_id) {
    soci::session& sql = DatabaseManager::getSession();
    Project new_project = project; // Copy to modify
    new_project.owner_id = owner_id;

    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&tt), "%Y-%m-%dT%H:%M:%SZ");
    new_project.created_at = ss.str();
    new_project.updated_at = ss.str();

    try {
        long long new_project_id;
        sql << "INSERT INTO projects (name, description, owner_id, created_at, updated_at) VALUES (:name, :description, :owner_id, :created_at, :updated_at) RETURNING id",
            soci::use(new_project.name), soci::use(new_project.description), soci::use(new_project.owner_id),
            soci::use(new_project.created_at), soci::use(new_project.updated_at),
            soci::into(new_project_id);
        new_project.id = new_project_id;
        Logger::info("Created project with ID {} for user_id: {}", *new_project.id, owner_id);
        return new_project;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error creating project for user_id {}: {}", owner_id, e.what());
        throw std::runtime_error("Failed to create project. Database error.");
    }
}

std::optional<Project> ProjectService::updateProject(long long project_id, const Project& updated_project, long long user_id) {
    soci::session& sql = DatabaseManager::getSession();

    // Check if the project exists and belongs to the user
    auto existing_project_opt = getProjectById(project_id, user_id);
    if (!existing_project_opt) {
        return std::nullopt; // Project not found or not owned by user
    }

    Project existing_project = *existing_project_opt;

    // Apply updates
    if (!updated_project.name.empty()) {
        existing_project.name = updated_project.name;
    }
    if (!updated_project.description.empty()) {
        existing_project.description = updated_project.description;
    }

    auto now = std::chrono::system_clock::now();
    auto tt = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&tt), "%Y-%m-%dT%H:%M:%SZ");
    existing_project.updated_at = ss.str();

    try {
        int rows_affected = 0;
        sql << "UPDATE projects SET name = :name, description = :description, updated_at = :updated_at WHERE id = :id AND owner_id = :owner_id",
            soci::use(existing_project.name), soci::use(existing_project.description), soci::use(existing_project.updated_at),
            soci::use(project_id), soci::use(user_id),
            soci::into(rows_affected); // For SQLite, soci::into(rows_affected) is often after the uses clause

        if (rows_affected == 0) {
            Logger::warn("Update project {} failed: Project not found or not owned by user {}.", project_id, user_id);
            return std::nullopt;
        }

        Logger::info("Updated project with ID {} for user_id: {}", project_id, user_id);
        existing_project.id = project_id; // Ensure ID is set
        return existing_project;
    } catch (const soci::soci_error& e) {
        Logger::error("Database error updating project {}: {}", project_id, e.what());
        throw std::runtime_error("Failed to update project. Database error.");
    }
}

bool ProjectService::deleteProject(long long project_id, long long user_id) {
    soci::session& sql = DatabaseManager::getSession();
    
    // Check if the project exists and belongs to the user before attempting to delete
    // This provides a more specific error/return value if not found/owned.
    auto existing_project_opt = getProjectById(project_id, user_id);
    if (!existing_project_opt) {
        return false; // Project not found or not owned by user
    }

    try {
        int rows_affected = 0;
        sql << "DELETE FROM projects WHERE id = :id AND owner_id = :owner_id",
            soci::use(project_id), soci::use(user_id),
            soci::into(rows_affected);

        if (rows_affected > 0) {
            Logger::info("Deleted project with ID {} for user_id: {}", project_id, user_id);
            return true;
        } else {
            // This case should ideally not be reached if getProjectById check passed
            Logger::warn("Delete project {} failed: Project not found or not owned by user {}.", project_id, user_id);
            return false;
        }
    } catch (const soci::soci_error& e) {
        Logger::error("Database error deleting project {}: {}", project_id, e.what());
        throw std::runtime_error("Failed to delete project. Database error.");
    }
}
```