```java
package com.example.paymentprocessor.transaction.repository;

import com.example.paymentprocessor.merchant.entity.Merchant;
import com.example.paymentprocessor.payment.entity.Payment;
import com.example.paymentprocessor.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByPayment(Payment payment);
    List<Transaction> findByMerchant(Merchant merchant);
}
```