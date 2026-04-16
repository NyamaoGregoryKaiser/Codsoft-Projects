```java
package com.example.paymentprocessor.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Random;

/**
 * This service simulates interaction with an external Payment Service Provider (PSP).
 * In a real application, this would involve:
 * - Calling a third-party API (e.g., Stripe, PayPal, Square, Adyen)
 * - Handling various API specific requests/responses
 * - Error handling for network issues, API errors, etc.
 * - Securely sending sensitive card details (often tokenized before reaching the backend).
 */
@Service
@Slf4j
public class ExternalPaymentGatewayService {

    private final Random random = new Random();

    /**
     * Simulates processing a new transaction (sale or authorization).
     *
     * @param transactionRef Our internal transaction ID for logging/correlation
     * @param amount The amount of the transaction
     * @param currency The currency of the transaction
     * @param cardNumber Last 4 digits (in a real system, full tokenized card info)
     * @return true if the transaction is successful, false otherwise.
     */
    public boolean processTransaction(String transactionRef, BigDecimal amount, String currency, String cardNumber) {
        log.info("Simulating PSP: Processing transaction Ref: {}, Amount: {} {}, Card: XXXX-XXXX-XXXX-{}",
                transactionRef, amount, currency, cardNumber.substring(cardNumber.length() - 4));
        // Simulate a 90% success rate for initial processing
        return random.nextDouble() < 0.90;
    }

    /**
     * Simulates capturing an authorized transaction.
     *
     * @param pspTransactionId The ID returned by the PSP for the initial authorization
     * @param amount The amount to capture
     * @param currency The currency
     * @return true if capture is successful.
     */
    public boolean captureTransaction(String pspTransactionId, BigDecimal amount, String currency) {
        log.info("Simulating PSP: Capturing transaction PSP ID: {}, Amount: {} {}", pspTransactionId, amount, currency);
        // Simulate a 95% success rate for capture
        return random.nextDouble() < 0.95;
    }

    /**
     * Simulates refunding a captured transaction.
     *
     * @param pspTransactionId The ID returned by the PSP for the captured payment
     * @param refundAmount The amount to refund
     * @param currency The currency
     * @return true if refund is successful.
     */
    public boolean refundTransaction(String pspTransactionId, BigDecimal refundAmount, String currency) {
        log.info("Simulating PSP: Refunding transaction PSP ID: {}, Amount: {} {}", pspTransactionId, refundAmount, currency);
        // Simulate a 98% success rate for refund
        return random.nextDouble() < 0.98;
    }

    /**
     * Simulates voiding an authorized transaction.
     *
     * @param pspTransactionId The ID returned by the PSP for the authorized payment
     * @param amount The original authorized amount
     * @param currency The currency
     * @return true if void is successful.
     */
    public boolean voidTransaction(String pspTransactionId, BigDecimal amount, String currency) {
        log.info("Simulating PSP: Voiding transaction PSP ID: {}, Amount: {} {}", pspTransactionId, amount, currency);
        // Simulate a 98% success rate for void
        return random.nextDouble() < 0.98;
    }
}
```