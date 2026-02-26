package com.ecommerce.controller;

import com.ecommerce.dto.OrderDTO;
import com.ecommerce.entity.Order;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.UserService;
import com.ecommerce.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Order Management", description = "APIs for managing user orders")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService; // To get current user ID

    private Long getCurrentUserId(UserDetails userDetails) {
        return userService.getAllUsers().stream()
                .filter(u -> u.getUsername().equals(userDetails.getUsername()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found from security context"))
                .getId();
    }

    @Operation(summary = "Place a new order from current user's cart")
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDTO> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OrderDTO orderDTO) { // Expects shippingAddress in orderDTO
        Long userId = getCurrentUserId(userDetails);
        OrderDTO createdOrder = orderService.placeOrderFromCart(userId, orderDTO.getShippingAddress());
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }

    @Operation(summary = "Get a specific order by ID for the current user")
    @GetMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDTO> getOrderById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long orderId) {
        Long userId = getCurrentUserId(userDetails);
        OrderDTO order = orderService.getOrderById(orderId, userId);
        return ResponseEntity.ok(order);
    }

    @Operation(summary = "Get all orders for the current user with pagination and sorting")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<OrderDTO>> getUserOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "pageNo", defaultValue = AppConstants.DEFAULT_PAGE_NUMBER, required = false) int pageNo,
            @RequestParam(value = "pageSize", defaultValue = AppConstants.DEFAULT_PAGE_SIZE, required = false) int pageSize,
            @RequestParam(value = "sortBy", defaultValue = "orderDate", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = AppConstants.DEFAULT_SORT_DIRECTION, required = false) String sortDir) {
        Long userId = getCurrentUserId(userDetails);
        Page<OrderDTO> orders = orderService.getUserOrders(userId, pageNo, pageSize, sortBy, sortDir);
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Update order status (Admin only)")
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('" + AppConstants.ADMIN + "')")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> statusUpdate) {
        String newStatusStr = statusUpdate.get("status");
        if (newStatusStr == null) {
            throw new IllegalArgumentException("Status field is required.");
        }
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(newStatusStr.toUpperCase());
        OrderDTO updatedOrder = orderService.updateOrderStatus(orderId, newStatus);
        return ResponseEntity.ok(updatedOrder);
    }
}