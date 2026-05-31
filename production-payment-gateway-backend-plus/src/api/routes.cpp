```cpp
#include "routes.hpp"
#include "auth_middleware.hpp"
#include "rate_limiter_middleware.hpp" // Not implemented here, but would be similar
#include "../utils/logger.hpp"
#include "../utils/jwt_manager.hpp"
#include <nlohmann/json.hpp>
#include <stdexcept>

// Initialize global service pointers (dependency injection via `setupRoutes` is better)
// For simplicity in this large example, we use global pointers and init them once.
Zenith::Services::UserService* Zenith::Api::userService = nullptr;
// Zenith::Services::PaymentMethodService* Zenith::Api::paymentMethodService = nullptr;
// Zenith::Services::TransactionService* Zenith::Api::transactionService = nullptr;

namespace Zenith {
namespace Api {

// Centralized error handling helper
void handleApiError(httplib::Response& res, const std::string& message, int status_code, const std::string& log_message = "") {
    nlohmann::json error_json;
    error_json["message"] = message;
    res.status = status_code;
    res.set_content(error_json.dump(), "application/json");
    if (!log_message.empty()) {
        LOG_ERROR("API Error ({0}): {1}", status_code, log_message);
    } else {
        LOG_ERROR("API Error ({0}): {1}", status_code, message);
    }
}

void setupRoutes(httplib::Server& svr) {
    // --- Initialize Repositories and Services ---
    // This part should ideally be handled by a proper DI container or Factory in main.
    static Database::UserRepository userRepo;
    // static Database::PaymentMethodRepository paymentMethodRepo;
    // static Database::TransactionRepository transactionRepo;

    static Services::UserService actualUserService(userRepo);
    // static Services::PaymentMethodService actualPaymentMethodService(paymentMethodRepo);
    // static Services::TransactionService actualTransactionService(transactionRepo, paymentMethodRepo, ...);

    userService = &actualUserService; // Assign to global pointer for routes to use
    // paymentMethodService = &actualPaymentMethodService;
    // transactionService = &actualTransactionService;

    // --- Public Routes (No Auth Required) ---

    // Health Check
    svr.Get("/health", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("{\"status\": \"UP\"}", "application/json");
        res.status = 200;
    });

    // User Login
    svr.Post("/auth/login", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json_body = nlohmann::json::parse(req.body);
            std::string email = json_body.at("email");
            std::string password = json_body.at("password");

            auto user_opt = userService->authenticateUser(email, password);
            if (!user_opt) {
                handleApiError(res, "Invalid credentials", 401, "Login attempt failed for email: " + email);
                return;
            }

            Utils::JwtPayload payload;
            payload.user_id = user_opt->id;
            payload.username = user_opt->username;
            payload.email = user_opt->email;
            payload.role = user_opt->role;
            std::string token = Utils::JwtManager::getInstance().generateToken(payload);

            nlohmann::json response_json;
            response_json["message"] = "Login successful";
            response_json["token"] = token;
            response_json["user"] = user_opt->toJson(); // Only include safe user info
            res.set_content(response_json.dump(), "application/json");
            res.status = 200;
            LOG_INFO("User {0} logged in successfully.", user_opt->username);

        } catch (const nlohmann::json::exception& e) {
            handleApiError(res, "Invalid JSON body or missing fields.", 400, "JSON parsing error on login: " + std::string(e.what()));
        } catch (const std::exception& e) {
            handleApiError(res, "Server error during login.", 500, "Login processing error: " + std::string(e.what()));
        }
    });

    // User Registration
    svr.Post("/auth/register", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto json_body = nlohmann::json::parse(req.body);
            std::string username = json_body.at("username");
            std::string email = json_body.at("email");
            std::string password = json_body.at("password");
            std::string full_name = json_body.at("fullName");
            std::string address = json_body.at("address");
            std::string phone_number = json_body.at("phoneNumber");
            std::string role = json_body.contains("role") ? json_body.at("role").get<std::string>() : "customer"; // Default to customer

            long userId = userService->createUser(username, email, password, full_name, address, phone_number, role);

            nlohmann::json response_json;
            response_json["message"] = "User registered successfully";
            response_json["userId"] = userId;
            res.set_content(response_json.dump(), "application/json");
            res.status = 201;
            LOG_INFO("New user registered with ID: {0}", userId);

        } catch (const nlohmann::json::exception& e) {
            handleApiError(res, "Invalid JSON body or missing fields.", 400, "JSON parsing error on registration: " + std::string(e.what()));
        } catch (const std::runtime_error& e) {
            handleApiError(res, e.what(), 409, "User registration conflict: " + std::string(e.what())); // 409 Conflict for duplicates
        } catch (const std::exception& e) {
            handleApiError(res, "Server error during registration.", 500, "Registration processing error: " + std::string(e.what()));
        }
    });

    // --- Authenticated Routes (Require JWT) ---
    // Apply authMiddleware to a group of routes or individual routes
    // For httplib, it's typically applied per route or managed through chaining (though less elegant than frameworks with route groups).
    // Let's create a chain for demonstration.
    auto authenticated_route = [&](const std::string& path, httplib::Server::Handler handler) {
        // This is a simplified way to chain, not a full-fledged router middleware application.
        // For production, a more sophisticated router/middleware system would be used.
        svr.Get(path, Api::authMiddleware(handler));
        svr.Post(path, Api::authMiddleware(handler));
        svr.Put(path, Api::authMiddleware(handler));
        svr.Delete(path, Api::authMiddleware(handler));
    };

    // Example: Get current user's profile
    svr.Get("/users/me", authMiddleware([](const httplib::Request& req, httplib::Response& res) {
        try {
            long userId = *req.get_attr<long>("userId");
            auto user_opt = userService->getUserById(userId);

            if (!user_opt) {
                handleApiError(res, "User not found (auth error)", 404, "Authenticated user ID {0} not found in DB.", userId);
                return;
            }

            res.set_content(user_opt->toJson().dump(), "application/json");
            res.status = 200;
        } catch (const std::exception& e) {
            handleApiError(res, "Server error fetching user profile.", 500, "Error getting user profile: " + std::string(e.what()));
        }
    }));

    // Example: Admin-only route to get all users
    svr.Get("/admin/users", authMiddleware(roleMiddleware([](const httplib::Request& req, httplib::Response& res) {
        try {
            std::vector<Models::User> users = userService->getAllUsers();
            nlohmann::json users_json = nlohmann::json::array();
            for (const auto& user : users) {
                users_json.push_back(user.toJson());
            }
            res.set_content(users_json.dump(), "application/json");
            res.status = 200;
        } catch (const std::exception& e) {
            handleApiError(res, "Server error fetching all users.", 500, "Error getting all users: " + std::string(e.what()));
        }
    }, "admin"))); // Requires 'admin' role

    // TODO: Implement more routes for Payment Methods, Transactions, etc.
    // Example: Create a new payment method for authenticated user
    // svr.Post("/payment-methods", authMiddleware([](const httplib::Request& req, httplib::Response& res) {
    //     try {
    //         long userId = *req.get_attr<long>("userId");
    //         auto json_body = nlohmann::json::parse(req.body);
    //         // ... extract payment method details
    //         // long pm_id = paymentMethodService->createPaymentMethod(userId, ...);
    //         res.set_content("{\"message\": \"Payment method created\"}", "application/json");
    //         res.status = 201;
    //     } catch (const std::exception& e) {
    //         handleApiError(res, "Failed to create payment method.", 500, e.what());
    //     }
    // }));
}

} // namespace Api
} // namespace Zenith
```