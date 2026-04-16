```java
package com.example.paymentprocessor.payment.controller;

import com.example.paymentprocessor.auth.service.JwtService;
import com.example.paymentprocessor.auth.entity.User;
import com.example.paymentprocessor.auth.entity.UserRole;
import com.example.paymentprocessor.merchant.entity.Merchant;
import com.example.paymentprocessor.merchant.repository.MerchantRepository;
import com.example.paymentprocessor.payment.dto.PaymentRequest;
import com.example.paymentprocessor.payment.entity.PaymentStatus;
import com.example.paymentprocessor.payment.entity.PaymentType;
import com.example.paymentprocessor.payment.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PaymentControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // For integration tests, create fresh schema
        registry.add("spring.flyway.enabled", () -> "false"); // Disable flyway for integration tests with create-drop
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JwtService jwtService;

    private Merchant testMerchant;
    private String merchantApiKey;
    private String adminJwtToken;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll(); // Clean up payments
        merchantRepository.deleteAll(); // Clean up merchants

        // Create a test merchant
        testMerchant = Merchant.builder()
                .name("Integration Test Merchant")
                .apiKey(UUID.randomUUID().toString())
                .email("integration@test.com")
                .isActive(true)
                .build();
        testMerchant = merchantRepository.save(testMerchant);
        merchantApiKey = testMerchant.getApiKey();

        // Create an admin user and generate JWT token
        User adminUser = User.builder()
                .username("test_admin")
                .password("password") // Password not used directly here, just for token generation
                .role(UserRole.ADMIN)
                .isEnabled(true)
                .build();
        adminJwtToken = jwtService.generateToken(adminUser); // Generate a token for a mock admin
    }

    @Test
    @DisplayName("Should successfully initiate a SALE payment")
    void shouldInitiateSalePaymentSuccessfully() throws Exception {
        UUID externalId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        PaymentRequest request = PaymentRequest.builder()
                .externalId(externalId)
                .amount(BigDecimal.valueOf(150.75))
                .currency("USD")
                .type(PaymentType.SALE)
                .cardNumber("4111222233334444")
                .expiryMonth("12")
                .expiryYear("2025")
                .cvv("123")
                .description("Test Sale Payment")
                .build();

        mockMvc.perform(post("/api/v1/merchants/{merchantId}/payments", testMerchant.getId())
                        .header("X-API-Key", merchantApiKey)
                        .header("X-Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.externalId").value(externalId.toString()))
                .andExpect(jsonPath("$.status").value(PaymentStatus.CAPTURED.name()))
                .andExpect(jsonPath("$.amount").value(150.75));

        assertThat(paymentRepository.findByExternalIdAndMerchant(externalId, testMerchant)).isPresent();
        assertThat(paymentRepository.findByIdempotencyKey(idempotencyKey)).isPresent();
    }

    @Test
    @DisplayName("Should return 400 if idempotency key is missing")
    void shouldReturnBadRequestIfIdempotencyKeyMissing() throws Exception {
        PaymentRequest request = PaymentRequest.builder()
                .externalId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(10.00))
                .currency("USD")
                .type(PaymentType.SALE)
                .cardNumber("4111222233334444")
                .expiryMonth("12")
                .expiryYear("2025")
                .cvv("123")
                .description("Missing idempotency key test")
                .build();

        mockMvc.perform(post("/api/v1/merchants/{merchantId}/payments", testMerchant.getId())
                        .header("X-API-Key", merchantApiKey)
                        // X-Idempotency-Key header is missing
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("X-Idempotency-Key header is required."));
    }


    @Test
    @DisplayName("Should handle idempotent requests correctly")
    void shouldHandleIdempotentRequests() throws Exception {
        UUID externalId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        PaymentRequest request = PaymentRequest.builder()
                .externalId(externalId)
                .amount(BigDecimal.valueOf(200.00))
                .currency("EUR")
                .type(PaymentType.SALE)
                .cardNumber("4111222233334444")
                .expiryMonth("12")
                .expiryYear("2025")
                .cvv("123")
                .description("Idempotent Test Payment")
                .build();

        // First request
        mockMvc.perform(post("/api/v1/merchants/{merchantId}/payments", testMerchant.getId())
                        .header("X-API-Key", merchantApiKey)
                        .header("X-Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(PaymentStatus.CAPTURED.name()));

        // Second request with same idempotency key
        mockMvc.perform(post("/api/v1/merchants/{merchantId}/payments", testMerchant.getId())
                        .header("X-API-Key", merchantApiKey)
                        .header("X-Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) // Still returns 201 as per idempotency pattern
                .andExpect(jsonPath("$.status").value(PaymentStatus.CAPTURED.name()));

        assertThat(paymentRepository.findAll()).hasSize(1); // Only one payment should be created
    }

    @Test
    @DisplayName("Should retrieve a payment by ID for the correct merchant")
    void shouldRetrievePaymentById() throws Exception {
        // First, create a payment
        UUID externalId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        PaymentRequest request = PaymentRequest.builder()
                .externalId(externalId)
                .amount(BigDecimal.valueOf(50.00))
                .currency("GBP")
                .type(PaymentType.SALE)
                .cardNumber("4111222233334444")
                .expiryMonth("11")
                .expiryYear("2024")
                .cvv("123")
                .description("Retrieve Test Payment")
                .build();

        String createResponse = mockMvc.perform(post("/api/v1/merchants/{merchantId}/payments", testMerchant.getId())
                        .header("X-API-Key", merchantApiKey)
                        .header("X-Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID paymentId = UUID.fromString(objectMapper.readTree(createResponse).get("id").asText());

        // Now, retrieve the payment
        mockMvc.perform(get("/api/v1/merchants/{merchantId}/payments/{paymentId}", testMerchant.getId(), paymentId)
                        .header("Authorization", "Bearer " + adminJwtToken) // Using admin token for GET access
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(paymentId.toString()))
                .andExpect(jsonPath("$.externalId").value(externalId.toString()))
                .andExpect(jsonPath("$.status").value(PaymentStatus.CAPTURED.name()));
    }

    @Test
    @DisplayName("Should return 404 for non-existent payment")
    void shouldReturnNotFoundForNonExistentPayment() throws Exception {
        UUID nonExistentPaymentId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/merchants/{merchantId}/payments/{paymentId}", testMerchant.getId(), nonExistentPaymentId)
                        .header("Authorization", "Bearer " + adminJwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resource not found with ID: " + nonExistentPaymentId));
    }
}
```