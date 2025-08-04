```java
package com.example.paymentprocessor.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String paymentMethod;
    private BigDecimal amount;
    private String status; // e.g., "pending", "processing", "completed", "failed"


    // Getters and setters
}
```