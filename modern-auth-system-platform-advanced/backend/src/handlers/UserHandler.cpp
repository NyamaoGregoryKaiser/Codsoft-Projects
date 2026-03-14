#include "UserHandler.h"

UserHandler::UserHandler(Pistache::Rest::Router& router) {
    // User-specific protected routes
    Pistache::Rest::Routes::Get(router, "/api/users/profile", Middleware::jwtAuthentication, Pistache::Rest::Routes::bind(&UserHandler::getUserProfile, this));
    Pistache::Rest::Routes::Put(router, "/api/users/profile", Middleware::jwtAuthentication, Pistache::Rest::Routes::bind(&UserHandler::updateUserProfile, this));

    // Admin-only routes
    Pistache::Rest::Routes::Get(router, "/api/admin/users", Middleware::jwtAuthentication, Middleware::authorize(UserRole::ADMIN), Pistache::Rest::Routes::bind(&UserHandler::getAllUsers, this));
    Pistache::Rest::Routes::Get(router, "/api/admin/users/:id", Middleware::jwtAuthentication, Middleware::authorize(UserRole::ADMIN), Pistache::Rest::Routes::bind(&UserHandler::getUserById, this));
    Pistache::Rest::Routes::Post(router, "/api/admin/users", Middleware::jwtAuthentication, Middleware::authorize(UserRole::ADMIN), Pistache::Rest::Routes::bind(&UserHandler::createUser, this));
    Pistache::Rest::Routes::Put(router, "/api/admin/users/:id", Middleware::jwtAuthentication, Middleware::authorize(UserRole::ADMIN), Pistache::Rest::Routes::bind(&UserHandler::updateUser, this));
    Pistache::Rest::Routes::Delete(router, "/api/admin/users/:id", Middleware::jwtAuthentication, Middleware::authorize(UserRole::ADMIN), Pistache::Rest::Routes::bind(&UserHandler::deleteUser, this));
}

void UserHandler::getUserProfile(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        if (!Middleware::currentRequestUser.has_value()) {
            throw AuthException(AuthErrorType::Unauthorized, "Authentication context missing.");
        }

        std::optional<User> user = DBManager::getInstance().findUserById(Middleware::currentRequestUser->userId);

        if (!user.has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "User not found.");
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "User profile retrieved.";
        resBody["user"] = user->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("User profile for ID {} retrieved.", Middleware::currentRequestUser->userId);

    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Failed to retrieve user profile: " + std::string(e.what()));
    }
}

void UserHandler::updateUserProfile(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        if (!Middleware::currentRequestUser.has_value()) {
            throw AuthException(AuthErrorType::Unauthorized, "Authentication context missing.");
        }

        nlohmann::json reqBody = nlohmann::json::parse(request.body());

        std::optional<User> user = DBManager::getInstance().findUserById(Middleware::currentRequestUser->userId);
        if (!user.has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "User not found.");
        }

        bool updated = false;
        if (reqBody.count("username") && reqBody.at("username").is_string()) {
            std::string newUsername = reqBody.at("username").get<std::string>();
            if (newUsername.length() < 3) {
                 throw AuthException(AuthErrorType::BadRequest, "Username must be at least 3 characters.");
            }
            if (newUsername != user->getUsername()) {
                if (DBManager::getInstance().findUserByUsername(newUsername).has_value()) {
                    throw AuthException(AuthErrorType::UserAlreadyExists, "Username already taken.");
                }
                user->setUsername(newUsername);
                updated = true;
            }
        }
        if (reqBody.count("password") && reqBody.at("password").is_string()) {
            std::string newPassword = reqBody.at("password").get<std::string>();
            if (newPassword.length() < 6) {
                 throw AuthException(AuthErrorType::BadRequest, "Password must be at least 6 characters.");
            }
            user->setPasswordHash(PasswordHasher::hashPassword(newPassword));
            updated = true;
        }
        // Role cannot be updated by user themselves via this endpoint

        if (updated) {
            if (!DBManager::getInstance().updateUser(user.value())) {
                throw AuthException(AuthErrorType::InternalError, "Failed to update user in database.");
            }
            // Update thread_local context if username changed
            Middleware::currentRequestUser->username = user->getUsername();
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = updated ? "User profile updated successfully." : "No changes detected or invalid fields.";
        resBody["user"] = user->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("User ID {} profile updated.", Middleware::currentRequestUser->userId);

    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Failed to update user profile: " + std::string(e.what()));
    }
}

// --- Admin Operations ---

void UserHandler::getAllUsers(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        std::vector<User> users = DBManager::getInstance().getAllUsers();
        nlohmann::json usersJson = nlohmann::json::array();
        for (const auto& user : users) {
            usersJson.push_back(user.toJson());
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "Users retrieved successfully.";
        resBody["users"] = usersJson;

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("Admin {} retrieved all users.", Middleware::currentRequestUser->username);

    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Failed to retrieve all users: " + std::string(e.what()));
    }
}

void UserHandler::getUserById(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        int userId = request.param(":id").as<int>();
        std::optional<User> user = DBManager::getInstance().findUserById(userId);

        if (!user.has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "User not found.");
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "User retrieved successfully.";
        resBody["user"] = user->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("Admin {} retrieved user ID {}.", Middleware::currentRequestUser->username, userId);

    } catch (const std::runtime_error& e) { // Catches invalid param conversions
        throw AuthException(AuthErrorType::BadRequest, "Invalid user ID format.");
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Failed to retrieve user by ID: " + std::string(e.what()));
    }
}

void UserHandler::createUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        nlohmann::json reqBody = nlohmann::json::parse(request.body());
        std::string username = reqBody.at("username").get<std::string>();
        std::string password = reqBody.at("password").get<std::string>();
        std::string roleStr = reqBody.value("role", "USER"); // Admin can specify role

        if (username.empty() || password.empty()) {
            throw AuthException(AuthErrorType::BadRequest, "Username and password cannot be empty.");
        }
        if (username.length() < 3 || password.length() < 6) {
            throw AuthException(AuthErrorType::BadRequest, "Username must be at least 3 characters and password at least 6 characters.");
        }

        UserRole role = UserRole::USER;
        if (roleStr == "ADMIN") {
            role = UserRole::ADMIN;
        }

        if (DBManager::getInstance().findUserByUsername(username).has_value()) {
            throw AuthException(AuthErrorType::UserAlreadyExists, "User with this username already exists.");
        }

        std::string hashedPassword = PasswordHasher::hashPassword(password);
        std::optional<User> newUser = DBManager::getInstance().createUser(username, hashedPassword, role);

        if (!newUser.has_value()) {
            throw AuthException(AuthErrorType::InternalError, "Failed to create user in the database.");
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "User created successfully by admin.";
        resBody["user"] = newUser->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Created, resBody.dump());
        Logger::getLogger()->info("Admin {} created user '{}' (ID: {}).", Middleware::currentRequestUser->username, username, newUser->getId().value());

    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format or missing fields: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Admin user creation failed: " + std::string(e.what()));
    }
}

void UserHandler::updateUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        int targetUserId = request.param(":id").as<int>();
        nlohmann::json reqBody = nlohmann::json::parse(request.body());

        std::optional<User> user = DBManager::getInstance().findUserById(targetUserId);
        if (!user.has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "User to update not found.");
        }

        bool updated = false;
        if (reqBody.count("username") && reqBody.at("username").is_string()) {
            std::string newUsername = reqBody.at("username").get<std::string>();
            if (newUsername.length() < 3) {
                 throw AuthException(AuthErrorType::BadRequest, "Username must be at least 3 characters.");
            }
            if (newUsername != user->getUsername()) {
                if (DBManager::getInstance().findUserByUsername(newUsername).has_value() && DBManager::getInstance().findUserByUsername(newUsername)->getId() != targetUserId) {
                    throw AuthException(AuthErrorType::UserAlreadyExists, "Username already taken by another user.");
                }
                user->setUsername(newUsername);
                updated = true;
            }
        }
        if (reqBody.count("password") && reqBody.at("password").is_string()) {
            std::string newPassword = reqBody.at("password").get<std::string>();
            if (newPassword.length() < 6) {
                 throw AuthException(AuthErrorType::BadRequest, "Password must be at least 6 characters.");
            }
            user->setPasswordHash(PasswordHasher::hashPassword(newPassword));
            updated = true;
        }
        if (reqBody.count("role") && reqBody.at("role").is_string()) {
            std::string newRoleStr = reqBody.at("role").get<std::string>();
            UserRole newRole = UserRole::USER;
            if (newRoleStr == "ADMIN") {
                newRole = UserRole::ADMIN;
            } else if (newRoleStr != "USER") {
                throw AuthException(AuthErrorType::BadRequest, "Invalid role specified. Must be 'USER' or 'ADMIN'.");
            }
            if (newRole != user->getRole()) {
                user->setRole(newRole);
                updated = true;
            }
        }

        if (updated) {
            if (!DBManager::getInstance().updateUser(user.value())) {
                throw AuthException(AuthErrorType::InternalError, "Failed to update user in database.");
            }
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = updated ? "User updated successfully by admin." : "No changes detected or invalid fields.";
        resBody["user"] = user->toJson();

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("Admin {} updated user ID {}.", Middleware::currentRequestUser->username, targetUserId);

    } catch (const std::runtime_error& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid user ID format or JSON: " + std::string(e.what()));
    } catch (const nlohmann::json::exception& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid JSON format: " + std::string(e.what()));
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Admin user update failed: " + std::string(e.what()));
    }
}

void UserHandler::deleteUser(const Pistache::Rest::Request& request, Pistache::Http::ResponseWriter response) {
    try {
        int targetUserId = request.param(":id").as<int>();

        if (!DBManager::getInstance().findUserById(targetUserId).has_value()) {
            throw AuthException(AuthErrorType::UserNotFound, "User to delete not found.");
        }

        if (!DBManager::getInstance().deleteUser(targetUserId)) {
            throw AuthException(AuthErrorType::InternalError, "Failed to delete user from database.");
        }

        nlohmann::json resBody;
        resBody["status"] = "success";
        resBody["message"] = "User deleted successfully by admin.";

        response.headers().add<Pistache::Http::Header::ContentType>(Pistache::Http::Mime::MediaType("application/json"));
        response.send(Pistache::Http::Code::Ok, resBody.dump());
        Logger::getLogger()->info("Admin {} deleted user ID {}.", Middleware::currentRequestUser->username, targetUserId);

    } catch (const std::runtime_error& e) {
        throw AuthException(AuthErrorType::BadRequest, "Invalid user ID format.");
    } catch (const AuthException& e) {
        throw e;
    } catch (const std::exception& e) {
        throw AuthException(AuthErrorType::InternalError, "Admin user deletion failed: " + std::string(e.what()));
    }
}