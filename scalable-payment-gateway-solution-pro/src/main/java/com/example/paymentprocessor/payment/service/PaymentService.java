```java
package com.example.paymentprocessor.payment.service;

import com.example.paymentprocessor.common.exception.ResourceNotFoundException;
import com.example.paymentprocessor.common.exception.PaymentProcessingException;
import com.example.paymentprocessor.merchant.entity.Merchant;
import com.example.paymentprocessor.merchant.repository.MerchantRepository;
import com.example.paymentprocessor.payment.dto.PaymentRequest;
import com.example.paymentprocessor.payment.dto.PaymentResponse;
import com.example.paymentprocessor.payment.entity.Payment;
import com.example.paymentprocessor.payment.entity.PaymentStatus;
import com.example.paymentprocessor.payment.entity.PaymentType;
import com.example.paymentprocessor.payment.repository.PaymentRepository;
import com.example.paymentprocessor.transaction.entity.Transaction;
import com.example.paymentprocessor.transaction.entity.TransactionStatus;
import com.example.paymentprocessor.transaction.entity.TransactionType;
import com.example.paymentprocessor.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;
    // In a real system, this would be an external PSP integration service
    private final ExternalPaymentGatewayService externalPaymentGatewayService;

    // Idempotency check for payment requests
    @Transactional
    public PaymentResponse processPayment(UUID merchantId, String idempotencyKey, PaymentRequest request) {
        // 1. Idempotency Check
        Optional<Payment> existingPayment = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            log.info("Idempotent request for idempotencyKey: {}, returning existing payment status: {}", idempotencyKey, payment.getStatus());
            return mapToPaymentResponse(payment);
        }

        // 2. Merchant Validation
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + merchantId));
        if (!merchant.isActive()) {
            throw new PaymentProcessingException("Merchant account is inactive.");
        }

        // 3. Create initial PENDING payment record
        Payment payment = Payment.builder()
                .externalId(request.getExternalId())
                .merchant(merchant)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .type(request.getType())
                .status(PaymentStatus.PENDING)
                .description(request.getDescription())
                .cardLastFour(request.getCardNumber().substring(request.getCardNumber().length() - 4))
                .cardType("VISA") // Placeholder - should be determined from card number
                .idempotencyKey(idempotencyKey)
                .build();
        payment = paymentRepository.save(payment);

        // 4. Simulate external PSP call (real-world would use a PSP client)
        // Here we'd send request.getCardNumber(), request.getExpiryMonth(), etc. to PSP
        boolean pspSuccess = externalPaymentGatewayService.processTransaction(
                payment.getId().toString(), request.getAmount(), request.getCurrency(), request.getCardNumber());

        Transaction initialTransaction = null;
        try {
            if (pspSuccess) {
                // Update payment status based on type
                if (request.getType() == PaymentType.AUTHORIZE) {
                    payment.setStatus(PaymentStatus.AUTHORIZED);
                } else { // SALE
                    payment.setStatus(PaymentStatus.CAPTURED);
                    payment.setCapturedAt(LocalDateTime.now());
                }
                payment.setPspTransactionId("PSP_TRANS_" + UUID.randomUUID().toString().substring(0, 8)); // Simulate PSP ID
                payment.setProcessingFee(calculateProcessingFee(request.getAmount())); // Simulate fee calculation

                // Record successful transaction
                initialTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(merchant)
                        .type(mapPaymentTypeToTransactionType(request.getType()))
                        .status(TransactionStatus.SUCCESS)
                        .amount(request.getAmount())
                        .currency(request.getCurrency())
                        .description("Initial " + request.getType().name() + " transaction")
                        .referenceId(payment.getPspTransactionId())
                        .feeAmount(payment.getProcessingFee())
                        .build();

                log.info("Payment {} processed successfully via PSP. Status: {}", payment.getId(), payment.getStatus());

            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment declined by PSP.");

                // Record failed transaction
                initialTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(merchant)
                        .type(mapPaymentTypeToTransactionType(request.getType()))
                        .status(TransactionStatus.FAILED)
                        .amount(request.getAmount())
                        .currency(request.getCurrency())
                        .description("Initial " + request.getType().name() + " transaction failed")
                        .build();

                log.warn("Payment {} failed via PSP. Reason: {}", payment.getId(), payment.getFailureReason());
                throw new PaymentProcessingException("Payment failed: " + payment.getFailureReason());
            }
        } finally {
            paymentRepository.save(payment);
            if (initialTransaction != null) {
                transactionRepository.save(initialTransaction);
            }
        }

        // 5. Return response
        return mapToPaymentResponse(payment);
    }

    @Transactional
    @CacheEvict(value = "payment", key = "#id")
    public PaymentResponse capturePayment(UUID merchantId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getMerchant().getId().equals(merchantId)) {
            throw new PaymentProcessingException("Payment does not belong to the provided merchant.");
        }

        if (payment.getStatus() != PaymentStatus.AUTHORIZED) {
            throw new PaymentProcessingException("Payment can only be captured if in AUTHORIZED state. Current state: " + payment.getStatus());
        }

        // Simulate PSP capture call
        boolean pspSuccess = externalPaymentGatewayService.captureTransaction(
                payment.getPspTransactionId(), payment.getAmount(), payment.getCurrency());

        Transaction captureTransaction = null;
        try {
            if (pspSuccess) {
                payment.setStatus(PaymentStatus.CAPTURED);
                payment.setCapturedAt(LocalDateTime.now());
                payment.setProcessingFee(calculateProcessingFee(payment.getAmount())); // Recalculate or use initial fee
                log.info("Payment {} captured successfully.", paymentId);

                captureTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.CAPTURE)
                        .status(TransactionStatus.SUCCESS)
                        .amount(payment.getAmount())
                        .currency(payment.getCurrency())
                        .description("Capture transaction")
                        .referenceId(payment.getPspTransactionId())
                        .feeAmount(payment.getProcessingFee())
                        .build();
            } else {
                payment.setStatus(PaymentStatus.FAILED); // Or specific capture failed status
                payment.setFailureReason("Capture failed by PSP.");
                log.warn("Capture for payment {} failed by PSP.", paymentId);

                captureTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.CAPTURE)
                        .status(TransactionStatus.FAILED)
                        .amount(payment.getAmount())
                        .currency(payment.getCurrency())
                        .description("Capture transaction failed")
                        .referenceId(payment.getPspTransactionId())
                        .build();
                throw new PaymentProcessingException("Payment capture failed: " + payment.getFailureReason());
            }
        } finally {
            paymentRepository.save(payment);
            if (captureTransaction != null) {
                transactionRepository.save(captureTransaction);
            }
        }
        return mapToPaymentResponse(payment);
    }

    @Transactional
    @CacheEvict(value = "payment", key = "#id")
    public PaymentResponse refundPayment(UUID merchantId, UUID paymentId, BigDecimal refundAmount) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getMerchant().getId().equals(merchantId)) {
            throw new PaymentProcessingException("Payment does not belong to the provided merchant.");
        }

        if (!(payment.getStatus() == PaymentStatus.CAPTURED || payment.getStatus() == PaymentStatus.PARTIALLY_REFUNDED)) {
            throw new PaymentProcessingException("Payment can only be refunded if in CAPTURED or PARTIALLY_REFUNDED state. Current state: " + payment.getStatus());
        }

        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be positive.");
        }

        // Calculate already refunded amount (from successful refund transactions)
        BigDecimal totalRefunded = transactionRepository.findByPayment(payment).stream()
                .filter(t -> t.getType() == TransactionType.REFUND && t.getStatus() == TransactionStatus.SUCCESS)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maxRefundable = payment.getAmount().subtract(totalRefunded);

        if (refundAmount.compareTo(maxRefundable) > 0) {
            throw new PaymentProcessingException("Refund amount exceeds available balance. Max refundable: " + maxRefundable);
        }

        // Simulate PSP refund call
        boolean pspSuccess = externalPaymentGatewayService.refundTransaction(
                payment.getPspTransactionId(), refundAmount, payment.getCurrency());

        Transaction refundTransaction = null;
        try {
            if (pspSuccess) {
                totalRefunded = totalRefunded.add(refundAmount);
                if (totalRefunded.compareTo(payment.getAmount()) >= 0) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                } else {
                    payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
                }
                payment.setRefundedAt(LocalDateTime.now()); // Update to last refund time
                log.info("Payment {} refunded successfully. Amount: {}", paymentId, refundAmount);

                refundTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.REFUND)
                        .status(TransactionStatus.SUCCESS)
                        .amount(refundAmount)
                        .currency(payment.getCurrency())
                        .description("Refund transaction for " + refundAmount)
                        .referenceId("REFUND_PSP_ID_" + UUID.randomUUID().toString().substring(0, 8))
                        .build(); // PSP might return a new refund transaction ID
            } else {
                payment.setFailureReason("Refund failed by PSP.");
                log.warn("Refund for payment {} failed by PSP. Amount: {}", paymentId, refundAmount);

                refundTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.REFUND)
                        .status(TransactionStatus.FAILED)
                        .amount(refundAmount)
                        .currency(payment.getCurrency())
                        .description("Refund transaction failed for " + refundAmount)
                        .build();
                throw new PaymentProcessingException("Payment refund failed: " + payment.getFailureReason());
            }
        } finally {
            paymentRepository.save(payment);
            if (refundTransaction != null) {
                transactionRepository.save(refundTransaction);
            }
        }
        return mapToPaymentResponse(payment);
    }

    @Transactional
    @CacheEvict(value = "payment", key = "#id")
    public PaymentResponse voidPayment(UUID merchantId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getMerchant().getId().equals(merchantId)) {
            throw new PaymentProcessingException("Payment does not belong to the provided merchant.");
        }

        if (payment.getStatus() != PaymentStatus.AUTHORIZED) {
            throw new PaymentProcessingException("Payment can only be voided if in AUTHORIZED state. Current state: " + payment.getStatus());
        }

        // Simulate PSP void call
        boolean pspSuccess = externalPaymentGatewayService.voidTransaction(
                payment.getPspTransactionId(), payment.getAmount(), payment.getCurrency());

        Transaction voidTransaction = null;
        try {
            if (pspSuccess) {
                payment.setStatus(PaymentStatus.VOIDED);
                payment.setVoidedAt(LocalDateTime.now());
                log.info("Payment {} voided successfully.", paymentId);

                voidTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.VOID)
                        .status(TransactionStatus.SUCCESS)
                        .amount(payment.getAmount().negate()) // Represent as negative amount for void
                        .currency(payment.getCurrency())
                        .description("Void transaction")
                        .referenceId("VOID_PSP_ID_" + UUID.randomUUID().toString().substring(0, 8))
                        .build();
            } else {
                payment.setFailureReason("Void failed by PSP.");
                log.warn("Void for payment {} failed by PSP.", paymentId);

                voidTransaction = Transaction.builder()
                        .payment(payment)
                        .merchant(payment.getMerchant())
                        .type(TransactionType.VOID)
                        .status(TransactionStatus.FAILED)
                        .amount(payment.getAmount().negate())
                        .currency(payment.getCurrency())
                        .description("Void transaction failed")
                        .build();
                throw new PaymentProcessingException("Payment void failed: " + payment.getFailureReason());
            }
        } finally {
            paymentRepository.save(payment);
            if (voidTransaction != null) {
                transactionRepository.save(voidTransaction);
            }
        }
        return mapToPaymentResponse(payment);
    }


    @Cacheable(value = "payment", key = "#paymentId")
    public PaymentResponse getPaymentById(UUID merchantId, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getMerchant().getId().equals(merchantId)) {
            throw new PaymentProcessingException("Payment does not belong to the provided merchant.");
        }
        return mapToPaymentResponse(payment);
    }

    public List<PaymentResponse> getAllPaymentsForMerchant(UUID merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + merchantId));
        return paymentRepository.findByMerchant(merchant).stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }


    // --- Helper methods ---

    private BigDecimal calculateProcessingFee(BigDecimal amount) {
        // Simple placeholder fee calculation: 1% + 0.30 fixed fee
        // In a real system, this would be more complex, perhaps merchant-specific
        BigDecimal percentageFee = amount.multiply(BigDecimal.valueOf(0.01));
        BigDecimal fixedFee = BigDecimal.valueOf(0.30);
        return percentageFee.add(fixedFee);
    }

    private TransactionType mapPaymentTypeToTransactionType(PaymentType paymentType) {
        return switch (paymentType) {
            case SALE -> TransactionType.CHARGE;
            case AUTHORIZE -> TransactionType.AUTHORIZATION;
            case REFUND -> TransactionType.REFUND; // This case is handled in refundPayment specifically
            case VOID -> TransactionType.VOID;     // This case is handled in voidPayment specifically
        };
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .externalId(payment.getExternalId())
                .merchantId(payment.getMerchant().getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .description(payment.getDescription())
                .cardLastFour(payment.getCardLastFour())
                .cardType(payment.getCardType())
                .processingFee(payment.getProcessingFee())
                .createdAt(payment.getCreatedAt())
                .capturedAt(payment.getCapturedAt())
                .failureReason(payment.getFailureReason())
                .build();
    }
}
```

**`ExternalPaymentGatewayService.java`** (Mock for external PSP interaction)