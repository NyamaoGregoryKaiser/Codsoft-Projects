```java
package com.example.paymentprocessor.transaction.entity;

import com.example.paymentprocessor.common.entity.BaseEntity;
import com.example.paymentprocessor.merchant.entity.Merchant;
import com.example.paymentprocessor.payment.entity.Payment;
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

@Entity
@Table(name = "transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TransactionStatus status;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "description")
    private String description;

    @Column(name = "reference_id") // Could be PSP's transaction ID, or another internal ref
    private String referenceId;

    @Column(name = "fee_amount", precision = 19, scale = 4)
    private BigDecimal feeAmount;
}
```

**`TransactionType.java`**

```java
package com.example.paymentprocessor.transaction.entity;

public enum TransactionType {
    CHARGE,         // Initial payment from customer to merchant
    AUTHORIZATION,  // Funds reserved
    CAPTURE,        // Funds moved after authorization
    REFUND,         // Funds moved from merchant to customer
    VOID,           // Cancellation of authorization
    CHARGEBACK,     // Funds forcefully reversed by cardholder bank
    PAYOUT          // Funds transferred from processor to merchant bank account
}
```

**`TransactionStatus.java`**

```java
package com.example.paymentprocessor.transaction.entity;

public enum TransactionStatus {
    PENDING,
    SUCCESS,
    FAILED,
    REVERSED, // E.g., a refund was issued against this transaction
    CANCELLED
}
```