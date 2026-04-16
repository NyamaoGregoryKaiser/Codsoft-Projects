```java
package com.example.paymentprocessor.payment.controller;

import com.example.paymentprocessor.common.exception.PaymentProcessingException;
import com.example.paymentprocessor.payment.dto.PaymentRequest;
import com.example.paymentprocessor.payment.dto.PaymentResponse;
import com.example.paymentprocessor.payment.service.PaymentService;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/merchants/{merchantId}/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Management", description = "APIs for processing and managing merchant payments")
@SecurityRequirement(name = "bearerAuth") // For Swagger UI to show lock icon
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Initiate a new payment (Sale or Authorization)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Payment initiated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or payment processing error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping
    @RateLimiter(name = "paymentProcessingLimiter") // Apply rate limiting
    public ResponseEntity<PaymentResponse> initiatePayment(
            @PathVariable UUID merchantId,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new IllegalArgumentException("X-Idempotency-Key header is required.");
        }

        log.info("Initiating payment for merchantId: {} with externalId: {} and idempotencyKey: {}",
                merchantId, request.getExternalId(), idempotencyKey);
        try {
            PaymentResponse response = paymentService.processPayment(merchantId, idempotencyKey, request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (PaymentProcessingException e) {
            log.error("Payment processing failed for merchantId: {}, externalId: {}. Error: {}",
                    merchantId, request.getExternalId(), e.getMessage());
            return ResponseEntity.badRequest().build(); // Handled by global exception handler for proper error message
        }
    }

    @Operation(summary = "Capture an authorized payment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment captured successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or payment processing error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @PostMapping("/{paymentId}/capture")
    public ResponseEntity<PaymentResponse> capturePayment(
            @PathVariable UUID merchantId,
            @PathVariable UUID paymentId) {
        log.info("Capturing payment {} for merchantId {}", paymentId, merchantId);
        PaymentResponse response = paymentService.capturePayment(merchantId, paymentId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Refund a captured payment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment refunded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or payment processing error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable UUID merchantId,
            @PathVariable UUID paymentId,
            @RequestParam @NotNull BigDecimal amount) {
        log.info("Refunding payment {} for merchantId {} with amount {}", paymentId, merchantId, amount);
        PaymentResponse response = paymentService.refundPayment(merchantId, paymentId, amount);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Void an authorized payment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment voided successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or payment processing error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @PostMapping("/{paymentId}/void")
    public ResponseEntity<PaymentResponse> voidPayment(
            @PathVariable UUID merchantId,
            @PathVariable UUID paymentId) {
        log.info("Voiding payment {} for merchantId {}", paymentId, merchantId);
        PaymentResponse response = paymentService.voidPayment(merchantId, paymentId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get payment details by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable UUID merchantId,
            @PathVariable UUID paymentId) {
        log.debug("Fetching payment {} for merchantId {}", paymentId, merchantId);
        PaymentResponse response = paymentService.getPaymentById(merchantId, paymentId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get all payments for a specific merchant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of payments"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Merchant not found")
    })
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPaymentsForMerchant(@PathVariable UUID merchantId) {
        log.debug("Fetching all payments for merchantId {}", merchantId);
        List<PaymentResponse> payments = paymentService.getAllPaymentsForMerchant(merchantId);
        return ResponseEntity.ok(payments);
    }
}
```