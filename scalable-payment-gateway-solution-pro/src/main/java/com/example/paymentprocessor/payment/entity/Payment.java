```java
package com.example.paymentprocessor.payment.entity;

import com.example.paymentprocessor.common.entity.BaseEntity;
import com.example.paymentprocessor.merchant.entity.Merchant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {

    @Column(name = "external_id", unique = true, nullable = false)
    private UUID externalId; // Merchant's reference ID for the payment

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PaymentType type; // e.g., SALE, AUTHORIZE, REFUND, VOID

    @Column(name = "description")
    private String description;

    // Card details (encrypted or tokenized in real-world scenario)
    @Column(name = "card_last_four", length = 4)
    private String cardLastFour;

    @Column(name = "card_type", length = 20)
    private String cardType;

    @Column(name = "processing_fee", precision = 19, scale = 4)
    private BigDecimal processingFee;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "failure_reason")
    private String failureReason;

    // Idempotency key for preventing duplicate requests
    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    // Link to external PSP transaction ID if applicable
    @Column(name = "psp_transaction_id")
    private String pspTransactionId;
}
```

**`PaymentStatus.java`**

```java
package com.example.paymentprocessor.payment.entity;

public enum PaymentStatus {
    PENDING,        // Initial state
    AUTHORIZED,     // Funds reserved
    CAPTURED,       // Funds transferred to merchant
    FAILED,         // Payment failed during processing
    VOIDED,         // Authorized payment cancelled before capture
    REFUNDED,       // Captured payment fully or partially returned
    PARTIALLY_REFUNDED, // Captured payment partially returned
    REVERSED        // Funds forcefully taken back (e.g., chargeback)
}
```

**`PaymentType.java`**

```java
package com.example.paymentprocessor.payment.entity;

public enum PaymentType {
    SALE,       // Immediate capture
    AUTHORIZE,  // Authorize funds only, capture later
    REFUND,     // Return funds from a captured payment
    VOID        // Cancel an authorized but not captured payment
}
```