```java
package com.example.paymentprocessor.payment.repository;

import com.example.paymentprocessor.merchant.entity.Merchant;
import com.example.paymentprocessor.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByExternalIdAndMerchant(UUID externalId, Merchant merchant);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findByMerchant(Merchant merchant);

    @Query("SELECT p FROM Payment p WHERE p.merchant.id = :merchantId AND p.externalId = :externalId")
    Optional<Payment> findByMerchantIdAndExternalId(UUID merchantId, UUID externalId);
}
```