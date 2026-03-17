#pragma once

#include <string>

namespace cms {

enum class UserRole {
    GUEST = 0,
    USER,
    ADMIN,
    EDITOR // Example role
};

// Helper to convert string to UserRole
static UserRole stringToUserRole(const std::string& roleStr) {
    if (roleStr == "ADMIN") return UserRole::ADMIN;
    if (roleStr == "EDITOR") return UserRole::EDITOR;
    if (roleStr == "USER") return UserRole::USER;
    return UserRole::GUEST;
}

// Helper to convert UserRole to string
static std::string userRoleToString(UserRole role) {
    switch (role) {
        case UserRole::ADMIN: return "ADMIN";
        case UserRole::EDITOR: return "EDITOR";
        case UserRole::USER: return "USER";
        case UserRole::GUEST: return "GUEST";
        default: return "UNKNOWN";
    }
}

enum class PostStatus {
    DRAFT = 0,
    PENDING_REVIEW,
    PUBLISHED,
    ARCHIVED
};

static PostStatus stringToPostStatus(const std::string& statusStr) {
    if (statusStr == "PUBLISHED") return PostStatus::PUBLISHED;
    if (statusStr == "PENDING_REVIEW") return PostStatus::PENDING_REVIEW;
    if (statusStr == "ARCHIVED") return PostStatus::ARCHIVED;
    return PostStatus::DRAFT;
}

static std::string postStatusToString(PostStatus status) {
    switch (status) {
        case PostStatus::PUBLISHED: return "PUBLISHED";
        case PostStatus::PENDING_REVIEW: return "PENDING_REVIEW";
        case PostStatus::ARCHIVED: return "ARCHIVED";
        case PostStatus::DRAFT: return "DRAFT";
        default: return "UNKNOWN";
    }
}

} // namespace cms
```