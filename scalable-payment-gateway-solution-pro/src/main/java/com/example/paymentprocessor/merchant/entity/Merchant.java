```java
package com.example.paymentprocessor.merchant.entity;

import com.example.paymentprocessor.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "merchants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Merchant extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "api_key", unique = true, nullable = false, updatable = false)
    private String apiKey; // Unique key for API authentication (can be regenerated)

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    // Associated payment methods (e.g., credit card, bank transfer, etc.)
    // For simplicity, we're not detailing PaymentMethod entity here.
    // It would be a @ManyToMany or @OneToMany relationship.

    @OneToMany(mappedBy = "merchant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<MerchantAccount> merchantAccounts = new HashSet<>();
}
```

**`MerchantAccount.java`** (Bank accounts for payouts)

```java
package com.example.paymentprocessor.merchant.entity;

import com.example.paymentprocessor.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "merchant_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(name = "routing_number")
    private String routingNumber; // Or SWIFT/BIC

    @Column(name = "currency", nullable = false)
    private String currency; // E.g., USD, EUR

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false; // For KYC/AML checks
}
```