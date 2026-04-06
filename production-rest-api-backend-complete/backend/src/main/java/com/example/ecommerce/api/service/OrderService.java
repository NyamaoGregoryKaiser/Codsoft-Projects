package com.example.ecommerce.api.service;

import com.example.ecommerce.api.dto.OrderItemRequest;
import com.example.ecommerce.api.dto.OrderItemResponse;
import com.example.ecommerce.api.dto.OrderRequest;
import com.example.ecommerce.api.dto.OrderResponse;
import com.example.ecommerce.api.entity.*;
import com.example.ecommerce.api.exception.InsufficientStockException;
import com.example.ecommerce.api.exception.ResourceNotFoundException;
import com.example.ecommerce.api.exception.UnauthorizedActionException;
import com.example.ecommerce.api.repository.OrderRepository;
import com.example.ecommerce.api.repository.ProductRepository;
import com.example.ecommerce.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    @CacheEvict(value = "orders", allEntries = true) // Clear all order caches on new order
    public OrderResponse placeOrder(OrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Order order = Order.builder()
                .user(user)
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new java.util.ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            if (product.getStockQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .priceAtOrder(product.getPrice())
                    .build();
            orderItems.add(orderItem);

            totalAmount = totalAmount.add(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            // Decrease product stock
            product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());
            productRepository.save(product); // Save updated product stock
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        log.info("Order placed by user {} with ID: {}", userEmail, savedOrder.getId());
        return mapToOrderResponse(savedOrder);
    }

    @Cacheable(value = "orders", key = "'allOrders'")
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        log.info("Fetching all orders from DB (and caching)");
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "orders", key = "#id")
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id, String currentUserEmail, Collection<? extends GrantedAuthority> authorities) {
        log.info("Fetching order with ID: {} from DB (and caching)", id);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        // Check if the current user is an admin or the owner of the order
        boolean isAdmin = authorities.stream().anyMatch(a -> a.getAuthority().equals(Role.ADMIN.name()));
        if (!isAdmin && !order.getUser().getEmail().equals(currentUserEmail)) {
            throw new UnauthorizedActionException("You are not authorized to view this order.");
        }
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserEmail(String userEmail) {
        log.info("Fetching orders for user: {}", userEmail);
        return orderRepository.findByUserEmail(userEmail).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "orders", allEntries = true) // Clear all order caches on status update
    public OrderResponse updateOrderStatus(Long id, String newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        try {
            OrderStatus status = OrderStatus.valueOf(newStatus.toUpperCase());
            order.setStatus(status);
            Order updatedOrder = orderRepository.save(order);
            log.info("Order ID: {} status updated to {}", id, newStatus);
            return mapToOrderResponse(updatedOrder);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + newStatus);
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .priceAtOrder(item.getPriceAtOrder())
                        .subtotal(item.getPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .orderDate(order.getOrderDate())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .items(itemResponses)
                .build();
    }
}