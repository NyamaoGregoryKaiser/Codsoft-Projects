```java
package com.example.paymentprocessor.payment.service;

import com.example.paymentprocessor.common.exception.PaymentProcessingException;
import com.example.paymentprocessor.common.exception.ResourceNotFoundException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private MerchantRepository merchantRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private ExternalPaymentGatewayService externalPaymentGatewayService;

    @InjectMocks
    private PaymentService paymentService;

    private Merchant testMerchant;
    private PaymentRequest paymentRequest;
    private UUID merchantId;
    private UUID paymentId;
    private String idempotencyKey;

    @BeforeEach
    void setUp() {
        merchantId = UUID.randomUUID();
        paymentId = UUID.randomUUID();
        idempotencyKey = UUID.randomUUID().toString();

        testMerchant = Merchant.builder()
                .id(merchantId)
                .name("Test Merchant")
                .apiKey("test_api_key")
                .email("test@merchant.com")
                .isActive(true)
                .build();
        ReflectionTestUtils.setField(testMerchant, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(testMerchant, "updatedAt", LocalDateTime.now());


        paymentRequest = PaymentRequest.builder()
                .externalId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(100.00))
                .currency("USD")
                .type(PaymentType.SALE)
                .cardNumber("4111222233334444")
                .expiryMonth("12")
                .expiryYear("2025")
                .cvv("123")
                .description("Test payment")
                .build();
    }

    @Test
    @DisplayName("Should process new SALE payment successfully")
    void shouldProcessSalePaymentSuccessfully() {
        // Given
        Payment pendingPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(paymentRequest.getAmount())
                .currency(paymentRequest.getCurrency())
                .type(paymentRequest.getType())
                .status(PaymentStatus.PENDING)
                .idempotencyKey(idempotencyKey)
                .cardLastFour(paymentRequest.getCardNumber().substring(12))
                .cardType("VISA")
                .build();
        ReflectionTestUtils.setField(pendingPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(pendingPayment, "updatedAt", LocalDateTime.now());

        Payment capturedPayment = Payment.builder().from(pendingPayment)
                .status(PaymentStatus.CAPTURED)
                .pspTransactionId("PSP_TRANS_123")
                .processingFee(BigDecimal.valueOf(1.30)) // 1% + 0.30
                .capturedAt(LocalDateTime.now())
                .build();
        ReflectionTestUtils.setField(capturedPayment, "createdAt", pendingPayment.getCreatedAt());
        ReflectionTestUtils.setField(capturedPayment, "updatedAt", LocalDateTime.now());


        when(paymentRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(testMerchant));
        when(paymentRepository.save(any(Payment.class))).thenReturn(pendingPayment, capturedPayment);
        when(externalPaymentGatewayService.processTransaction(any(), any(), any(), any())).thenReturn(true);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        PaymentResponse response = paymentService.processPayment(merchantId, idempotencyKey, paymentRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
        assertThat(response.getAmount()).isEqualTo(paymentRequest.getAmount());
        assertThat(response.getMerchantId()).isEqualTo(merchantId);
        assertThat(response.getCapturedAt()).isNotNull();

        verify(paymentRepository, times(1)).findByIdempotencyKey(idempotencyKey);
        verify(merchantRepository, times(1)).findById(merchantId);
        verify(paymentRepository, times(2)).save(any(Payment.class)); // PENDING -> CAPTURED
        verify(externalPaymentGatewayService, times(1)).processTransaction(any(), any(), any(), any());
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should return existing payment for idempotent request")
    void shouldReturnExistingPaymentForIdempotentRequest() {
        // Given
        Payment existingPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(paymentRequest.getAmount())
                .currency(paymentRequest.getCurrency())
                .type(PaymentType.SALE)
                .status(PaymentStatus.CAPTURED)
                .idempotencyKey(idempotencyKey)
                .build();
        ReflectionTestUtils.setField(existingPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(existingPayment, "updatedAt", LocalDateTime.now());

        when(paymentRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.of(existingPayment));

        // When
        PaymentResponse response = paymentService.processPayment(merchantId, idempotencyKey, paymentRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(existingPayment.getId());
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.CAPTURED);

        verify(paymentRepository, times(1)).findByIdempotencyKey(idempotencyKey);
        verify(merchantRepository, never()).findById(any());
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(externalPaymentGatewayService, never()).processTransaction(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should fail if merchant is not found")
    void shouldFailIfMerchantNotFound() {
        // Given
        when(paymentRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.empty());

        // When / Then
        assertThrows(ResourceNotFoundException.class, () ->
                paymentService.processPayment(merchantId, idempotencyKey, paymentRequest));

        verify(paymentRepository, times(1)).findByIdempotencyKey(idempotencyKey);
        verify(merchantRepository, times(1)).findById(merchantId);
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(externalPaymentGatewayService, never()).processTransaction(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should fail if PSP processing fails")
    void shouldFailIfPspProcessingFails() {
        // Given
        Payment pendingPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(paymentRequest.getAmount())
                .currency(paymentRequest.getCurrency())
                .type(paymentRequest.getType())
                .status(PaymentStatus.PENDING)
                .idempotencyKey(idempotencyKey)
                .cardLastFour(paymentRequest.getCardNumber().substring(12))
                .cardType("VISA")
                .build();
        ReflectionTestUtils.setField(pendingPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(pendingPayment, "updatedAt", LocalDateTime.now());

        when(paymentRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(testMerchant));
        when(paymentRepository.save(any(Payment.class))).thenReturn(pendingPayment); // Save pending first
        when(externalPaymentGatewayService.processTransaction(any(), any(), any(), any())).thenReturn(false); // PSP fails

        // When / Then
        assertThrows(PaymentProcessingException.class, () ->
                paymentService.processPayment(merchantId, idempotencyKey, paymentRequest));

        verify(paymentRepository, times(1)).findByIdempotencyKey(idempotencyKey);
        verify(merchantRepository, times(1)).findById(merchantId);
        verify(paymentRepository, times(2)).save(any(Payment.class)); // PENDING -> FAILED
        verify(externalPaymentGatewayService, times(1)).processTransaction(any(), any(), any(), any());
        verify(transactionRepository, times(1)).save(any(Transaction.class)); // Save failed transaction
    }

    @Test
    @DisplayName("Should successfully capture an authorized payment")
    void shouldSuccessfullyCaptureAuthorizedPayment() {
        // Given
        Payment authorizedPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(BigDecimal.valueOf(50.00))
                .currency("EUR")
                .type(PaymentType.AUTHORIZE)
                .status(PaymentStatus.AUTHORIZED)
                .pspTransactionId("AUTH_PSP_ID_123")
                .build();
        ReflectionTestUtils.setField(authorizedPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(authorizedPayment, "updatedAt", LocalDateTime.now());

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(authorizedPayment));
        when(externalPaymentGatewayService.captureTransaction(any(), any(), any())).thenReturn(true);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0)); // Return the modified payment object
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        PaymentResponse response = paymentService.capturePayment(merchantId, paymentId);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
        assertThat(response.getCapturedAt()).isNotNull();
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(externalPaymentGatewayService, times(1)).captureTransaction(any(), any(), any());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should fail to capture if payment is not authorized")
    void shouldFailToCaptureIfNotAuthorized() {
        // Given
        Payment capturedPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(BigDecimal.valueOf(50.00))
                .currency("EUR")
                .type(PaymentType.SALE)
                .status(PaymentStatus.CAPTURED)
                .build();
        ReflectionTestUtils.setField(capturedPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(capturedPayment, "updatedAt", LocalDateTime.now());

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(capturedPayment));

        // When / Then
        assertThrows(PaymentProcessingException.class, () ->
                paymentService.capturePayment(merchantId, paymentId));

        verify(paymentRepository, never()).save(any(Payment.class));
        verify(externalPaymentGatewayService, never()).captureTransaction(any(), any(), any());
    }

    @Test
    @DisplayName("Should successfully refund a captured payment")
    void shouldSuccessfullyRefundCapturedPayment() {
        // Given
        Payment capturedPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(BigDecimal.valueOf(100.00))
                .currency("USD")
                .type(PaymentType.SALE)
                .status(PaymentStatus.CAPTURED)
                .pspTransactionId("PSP_TRANS_123")
                .build();
        ReflectionTestUtils.setField(capturedPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(capturedPayment, "updatedAt", LocalDateTime.now());

        BigDecimal refundAmount = BigDecimal.valueOf(50.00);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(capturedPayment));
        when(transactionRepository.findByPayment(any(Payment.class))).thenReturn(List.of()); // No previous refunds
        when(externalPaymentGatewayService.refundTransaction(any(), any(), any())).thenReturn(true);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        PaymentResponse response = paymentService.refundPayment(merchantId, paymentId, refundAmount);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PARTIALLY_REFUNDED);
        assertThat(response.getRefundedAt()).isNotNull();
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(transactionRepository, times(1)).findByPayment(any(Payment.class));
        verify(externalPaymentGatewayService, times(1)).refundTransaction(any(), any(), any());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should fully refund a captured payment")
    void shouldFullyRefundCapturedPayment() {
        // Given
        Payment capturedPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(BigDecimal.valueOf(100.00))
                .currency("USD")
                .type(PaymentType.SALE)
                .status(PaymentStatus.CAPTURED)
                .pspTransactionId("PSP_TRANS_123")
                .build();
        ReflectionTestUtils.setField(capturedPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(capturedPayment, "updatedAt", LocalDateTime.now());

        BigDecimal refundAmount = BigDecimal.valueOf(100.00);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(capturedPayment));
        when(transactionRepository.findByPayment(any(Payment.class))).thenReturn(List.of()); // No previous refunds
        when(externalPaymentGatewayService.refundTransaction(any(), any(), any())).thenReturn(true);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        PaymentResponse response = paymentService.refundPayment(merchantId, paymentId, refundAmount);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(response.getRefundedAt()).isNotNull();
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(transactionRepository, times(1)).findByPayment(any(Payment.class));
        verify(externalPaymentGatewayService, times(1)).refundTransaction(any(), any(), any());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should successfully void an authorized payment")
    void shouldSuccessfullyVoidAuthorizedPayment() {
        // Given
        Payment authorizedPayment = Payment.builder()
                .id(paymentId)
                .externalId(paymentRequest.getExternalId())
                .merchant(testMerchant)
                .amount(BigDecimal.valueOf(75.00))
                .currency("GBP")
                .type(PaymentType.AUTHORIZE)
                .status(PaymentStatus.AUTHORIZED)
                .pspTransactionId("AUTH_PSP_ID_456")
                .build();
        ReflectionTestUtils.setField(authorizedPayment, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(authorizedPayment, "updatedAt", LocalDateTime.now());

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(authorizedPayment));
        when(externalPaymentGatewayService.voidTransaction(any(), any(), any())).thenReturn(true);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        PaymentResponse response = paymentService.voidPayment(merchantId, paymentId);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.VOIDED);
        assertThat(response.getVoidedAt()).isNotNull();
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(externalPaymentGatewayService, times(1)).voidTransaction(any(), any(), any());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }
}
```