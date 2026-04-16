```java
package com.example.paymentprocessor.payment.dto;

import com.example.paymentprocessor.payment.entity.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "External ID is required")
    private UUID externalId; // Merchant's unique ID for their payment

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code (e.g., USD)")
    private String currency;

    @NotNull(message = "Payment type is required")
    private PaymentType type; // SALE, AUTHORIZE

    @NotBlank(message = "Card number is required")
    @Pattern(regexp = "^[0-9]{13,19}$", message = "Invalid card number format")
    private String cardNumber;

    @NotBlank(message = "Expiration month is required")
    @Pattern(regexp = "^(0[1-9]|1[0-2])$", message = "Expiration month must be MM (01-12)")
    private String expiryMonth;

    @NotBlank(message = "Expiration year is required")
    @Pattern(regexp = "^(20)\\d{2}$", message = "Expiration year must be YYYY (e.g., 2025)")
    private String expiryYear;

    @NotBlank(message = "CVV is required")
    @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV must be 3 or 4 digits")
    private String cvv;

    private String description;
}
```

**`PaymentResponse.java`**

```java
package com.example.paymentprocessor.payment.dto;

import com.example.paymentprocessor.payment.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID externalId;
    private UUID merchantId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String description;
    private String cardLastFour;
    private String cardType;
    private BigDecimal processingFee;
    private LocalDateTime createdAt;
    private LocalDateTime capturedAt;
    private String failureReason;
}
```