#pragma once

#include <string>

namespace cms {

// API Routes
const std::string API_V1 = "/api/v1";

const std::string AUTH_LOGIN_PATH = API_V1 + "/auth/login";
const std::string AUTH_REGISTER_PATH = API_V1 + "/auth/register";
const std::string AUTH_REFRESH_PATH = API_V1 + "/auth/refresh";
const std::string AUTH_LOGOUT_PATH = API_V1 + "/auth/logout";

const std::string USERS_BASE_PATH = API_V1 + "/users";
const std::string USER_BY_ID_PATH = USERS_BASE_PATH + "/{id}";
const std::string USER_PROFILE_PATH = USERS_BASE_PATH + "/profile";

const std::string CATEGORIES_BASE_PATH = API_V1 + "/categories";
const std::string CATEGORY_BY_ID_PATH = CATEGORIES_BASE_PATH + "/{id}";

const std::string POSTS_BASE_PATH = API_V1 + "/posts";
const std::string POST_BY_ID_PATH = POSTS_BASE_PATH + "/{id}";
const std::string POST_PUBLISH_PATH = POSTS_BASE_PATH + "/{id}/publish";
const std::string POST_DRAFT_PATH = POSTS_BASE_PATH + "/{id}/draft";

// Error messages
const std::string ERR_INVALID_CREDENTIALS = "Invalid username or password";
const std::string ERR_USER_EXISTS = "User with this email already exists";
const std::string ERR_UNAUTHORIZED = "Unauthorized access";
const std::string ERR_FORBIDDEN = "Forbidden: Insufficient permissions";
const std::string ERR_NOT_FOUND = "Resource not found";
const std::string ERR_INVALID_TOKEN = "Invalid or expired token";
const std::string ERR_SERVER_ERROR = "Internal server error";
const std::string ERR_BAD_REQUEST = "Bad request";

// JWT claims
const std::string JWT_CLAIM_USER_ID = "userId";
const std::string JWT_CLAIM_ROLE = "role";
const std::string JWT_CLAIM_TYPE = "type"; // "access" or "refresh"

// Cache keys prefixes
const std::string CACHE_KEY_USER_PREFIX = "user:";
const std::string CACHE_KEY_POST_PREFIX = "post:";
const std::string CACHE_KEY_CATEGORY_PREFIX = "category:";
const std::string CACHE_KEY_RATE_LIMIT_PREFIX = "rate_limit:";
const std::string CACHE_KEY_BLACKLIST_PREFIX = "jwt_blacklist:"; // For blacklisting revoked JWTs

} // namespace cms
```