package com.ecommerce.dto;

import com.ecommerce.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long id;
    private Long userId;
    private String username;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private Set<OrderItemDTO> orderItems;

    @NotNull(message = "Shipping address is required")
    private AddressDTO shippingAddress;

    private LocalDateTime updatedAt;
}