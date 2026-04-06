package com.example.ecommerce.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}