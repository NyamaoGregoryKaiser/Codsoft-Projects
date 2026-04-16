```markdown
# Payment Processing System - Architecture Overview

This document provides a high-level overview of the architecture for the Payment Processing System.

## 1. System Context Diagram

```
+----------------+       HTTP/S      +-----------------------------------------+
|                | <------------->   |  Payment Processing System (Backend)    |
|   Merchant     |                   |                                         |
|   (e.g., E-commerce,   |           | +--------------------+                  |
|   POS system)  |                   | | Payment Controller |                  |
|                |                   | +--------------------+                  |
+----------------+                   |           |                             |
        ^                            |           v                             |
        |  API Key (X-API-Key)       | +--------------------+                  |
        |  JWT (Bearer Token)        | |    Payment Service |                  |
        |                            | +--------------------+                  |
        |  HTTP/S                    |           |                             |
        |                            |           v                             |
+----------------+                   | +--------------------+                  |
|  Merchant Portal  | <----------->  | |  Transaction Service |                 |
|  User (Browser) |                  | +--------------------+                  |
+----------------+                   |           |                             |
                                     |           v                             |
                                     | +--------------------+                  |
                                     | |  Merchant Service  |                  |
                                     | +--------------------+                  |
                                     |           |                             |
                                     |           v                             |
                                     | +--------------------+                  |
                                     | |   Auth Service     |                  |
                                     | +--------------------+                  |
                                     |                                         |
+------------------------------------+-----------------------------------------+
             |         JDBC / TCP                  |         HTTP/S (Simulated)
             |                                     |
             v                                     v
+------------------------+             +-------------------------------------+
|   PostgreSQL Database  |             |  External Payment Service Provider  |
| (Payments, Merchants,  |             |  (Stripe, Adyen, PayPal, etc.)      |
|  Transactions, Users)  |             |                                     |
+------------------------+             +-------------------------------------+
```

## 2. Component Diagram (Backend Focus)

```
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                    Payment Processing System (Spring Boot Application)                                                |
| +------------------------------------+     +------------------------------------+     +------------------------------------+     +------------------------------------+ |
| |        Auth Module               |     |        Merchant Module             |     |        Payment Module              |     |      Transaction Module            | |
| |------------------------------------|     |------------------------------------|     |------------------------------------|     |------------------------------------| |
| | - User Entity                    |     | - Merchant Entity                  |     | - Payment Entity                   |     | - Transaction Entity               | |
| | - UserRepository                 |     | - MerchantRepository               |     | - PaymentRepository                |     | - TransactionRepository            | |
| | - AuthService (JWT generation)   |     | - MerchantService                  |     | - PaymentService                   |     | - TransactionService               | |
| | - JwtService                     |     | - MerchantController               |     | - PaymentController                |     | - TransactionController            | |
| | - SecurityConfig                 |     | - DTOs (MerchantRequest, Response) |     | - DTOs (PaymentRequest, Response)  |     | - DTOs (TransactionResponse)       | |
| | - JwtAuthenticationFilter        |     |                                    |     |                                    |     |                                    | |
| +------------------------------------+     +------------------------------------+     +------------------------------------+     +------------------------------------+ |
|    ^       ^                                ^                                    ^                                          ^                                        |
|    |       |                                |                                    |                                          |                                        |
|    |       |                                |                                    |                                          |                                        |
| +--|-----------------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| |                                   Common Components                                                                                                                   | |
| |---------------------------------------------------------------------------------------------------------------------------------------------------------------------+ |
| | - GlobalExceptionHandler           (Centralized Error Handling)                                                                                                       | |
| | - BaseEntity                       (Auditing, UUID IDs)                                                                                                               | |
| | - Configuration                    (CacheConfig, WebConfig)                                                                                                           | |
| | - Logging                          (SLF4J, Logback)                                                                                                                   | |
| | - Metrics                          (Actuator, Micrometer)                                                                                                             | |
| | - Caching                          (Caffeine)                                                                                                                         | |
| | - Rate Limiting                    (Resilience4j)                                                                                                                     | |
| +-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
        |                                                                                                                                                             |
        | JDBC / JPA                                                                                                                                                  | HTTP/S
        v                                                                                                                                                             v
+------------------------------------+                                                                                           +-------------------------------------+
|        PostgreSQL Database         |                                                                                           | External Payment Gateway Service    |
| (Schema: Flyway controlled)        |                                                                                           | (e.g., Stripe, Adyen, PayPal)       |
+------------------------------------+                                                                                           +-------------------------------------+
```

## 3. Data Flow (Payment Initiation)

1.  **Merchant Request:** A merchant system sends a `POST /api/v1/merchants/{merchantId}/payments` request to the Payment Processing System.
    *   Headers: `X-API-Key` (for authentication), `X-Idempotency-Key` (for request uniqueness).
    *   Body: `PaymentRequest` (amount, currency, card details, externalId, payment type).
2.  **Authentication & Authorization:**
    *   `JwtAuthenticationFilter` intercepts the request, validates `X-API-Key` against `merchantId` in the path, and authenticates the merchant.
    *   Spring Security authorizes the request based on roles/authorities.
3.  **Controller Layer (`PaymentController`):**
    *   Receives the request, performs DTO validation (`@Valid`).
    *   Passes the request to `PaymentService`.
4.  **Service Layer (`PaymentService`):**
    *   **Idempotency Check:** Checks if `X-Idempotency-Key` exists in `PaymentRepository`. If so, returns the previously processed payment.
    *   **Merchant Validation:** Ensures the `merchantId` exists and is active.
    *   **Initial Record:** Creates a `Payment` entity with `PENDING` status and saves it to the `payments` table.
    *   **External PSP Call:** Calls `ExternalPaymentGatewayService` (simulated in this project) to process the actual transaction with the external PSP.
        *   In a real system, this involves sending tokenized card data and payment details to the PSP API.
    *   **Status Update:** Based on the PSP response:
        *   If successful for `SALE`: Updates `Payment` status to `CAPTURED`, sets `pspTransactionId`, `processingFee`, `capturedAt`.
        *   If successful for `AUTHORIZE`: Updates `Payment` status to `AUTHORIZED`, sets `pspTransactionId`, `processingFee`.
        *   If failed: Updates `Payment` status to `FAILED`, sets `failureReason`.
    *   **Transaction Record:** Creates a `Transaction` entity with appropriate type, status, and links to the `Payment` and `Merchant`, saving it to the `transactions` table.
    *   **Save & Respond:** Saves the updated `Payment` and the new `Transaction` to the database. Maps the `Payment` entity to `PaymentResponse` DTO and returns.
5.  **Database Layer (PostgreSQL):** All persistent data (merchants, payments, transactions) is stored and retrieved. Flyway ensures schema evolution.
6.  **Error Handling:** `GlobalExceptionHandler` catches any exceptions (validation, resource not found, processing errors) and returns standardized `ErrorResponse` DTOs.
7.  **Logging & Monitoring:** Events are logged throughout the process. Metrics are collected by Actuator/Micrometer.

## 4. Scalability Considerations

*   **Database:** PostgreSQL can be scaled vertically (more powerful hardware) or horizontally (read replicas, sharding for extreme scale).
*   **Application:** Spring Boot application can be scaled horizontally by running multiple instances behind a load balancer.
*   **Caching:** Caffeine for local caching, can be extended with distributed caches like Redis for a multi-instance setup.
*   **Asynchronous Processing:** Introduce message queues (e.g., Kafka) for decoupling and handling high-throughput, non-critical tasks.
*   **Microservices:** The modular design allows for logical separation into independent services as the system grows.

## 5. Security Considerations

*   **Authentication & Authorization:** JWT for users, API Keys for merchants with RBAC.
*   **Data Encryption:** Sensitive data (e.g., full card numbers) should never be stored directly; use tokenization services or strong encryption at rest/in transit.
*   **HTTPS:** All communication should be over HTTPS.
*   **Input Validation:** Strict validation of all incoming requests to prevent injection attacks and invalid data.
*   **Logging:** Avoid logging sensitive information.
*   **Rate Limiting:** Protect against brute-force attacks and API abuse.
*   **Dependency Scanning:** Regularly scan for known vulnerabilities in libraries.
*   **Least Privilege:** Adhere to the principle of least privilege for users and services.
```