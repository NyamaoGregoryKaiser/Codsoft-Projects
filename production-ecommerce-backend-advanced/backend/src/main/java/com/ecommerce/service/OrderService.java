package com.ecommerce.service;

import com.ecommerce.dto.AddressDTO;
import com.ecommerce.dto.CartDTO;
import com.ecommerce.dto.CartItemDTO;
import com.ecommerce.dto.OrderDTO;
import com.ecommerce.dto.OrderItemDTO;
import com.ecommerce.entity.Address;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.AddressRepository;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartService cartService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;

    @Transactional
    public OrderDTO placeOrderFromCart(Long userId, AddressDTO shippingAddressDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        CartDTO cartDTO = cartService.getCartByUserId(userId);
        if (cartDTO.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot place order with an empty cart.");
        }

        // Check product stock and decrement
        for (CartItemDTO itemDTO : cartDTO.getCartItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemDTO.getProductId()));
            if (product.getStockQuantity() < itemDTO.getQuantity()) {
                throw new IllegalArgumentException("Not enough stock for product: " + product.getName());
            }
            product.setStockQuantity(product.getStockQuantity() - itemDTO.getQuantity());
            productRepository.save(product);
        }

        // Map AddressDTO to Address entity
        Address shippingAddress = mapAddressDTOToEntity(shippingAddressDTO);
        shippingAddress.setUser(user); // Associate address with the user
        addressRepository.save(shippingAddress); // Save the shipping address

        // Create Order
        Order order = Order.builder()
                .user(user)
                .totalAmount(cartDTO.getTotalAmount())
                .status(Order.OrderStatus.PENDING) // Initial status
                .shippingAddress(shippingAddress)
                .build();

        // Create Order Items from Cart Items
        Set<OrderItem> orderItems = new HashSet<>();
        for (CartItemDTO cartItemDTO : cartDTO.getCartItems()) {
            Product product = productRepository.findById(cartItemDTO.getProductId()).get(); // Already checked for existence
            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(cartItemDTO.getQuantity())
                    .unitPrice(cartItemDTO.getUnitPrice())
                    .subTotal(cartItemDTO.getSubTotal())
                    .order(order) // Bidirectional link
                    .build();
            orderItems.add(orderItem);
        }
        order.setOrderItems(orderItems); // Set the collection in the order entity

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems); // Explicitly save order items

        // Clear the user's cart
        cartService.clearCart(userId);

        log.info("Order placed successfully for user {}. Order ID: {}", userId, savedOrder.getId());

        return mapToDTO(savedOrder);
    }

    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserIdWithItems(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return mapToDTO(order);
    }

    public Page<OrderDTO> getUserOrders(Long userId, int pageNo, int pageSize, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);

        Page<Order> orders = orderRepository.findByUserId(userId, pageable);
        return orders.map(this::mapToDTO);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        log.info("Order {} status updated to {}", orderId, newStatus);
        return mapToDTO(updatedOrder);
    }

    private OrderDTO mapToDTO(Order order) {
        Set<OrderItemDTO> itemDTOS = order.getOrderItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImage(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subTotal(item.getSubTotal())
                        .build())
                .collect(Collectors.toSet());

        return OrderDTO.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .username(order.getUser().getUsername())
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .orderItems(itemDTOS)
                .shippingAddress(mapAddressEntityToDTO(order.getShippingAddress()))
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private Address mapAddressDTOToEntity(AddressDTO dto) {
        return Address.builder()
                .id(dto.getId()) // May be null for new address
                .street(dto.getStreet())
                .city(dto.getCity())
                .state(dto.getState())
                .postalCode(dto.getPostalCode())
                .country(dto.getCountry())
                .isDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false)
                .build();
    }

    private AddressDTO mapAddressEntityToDTO(Address entity) {
        return AddressDTO.builder()
                .id(entity.getId())
                .street(entity.getStreet())
                .city(entity.getCity())
                .state(entity.getState())
                .postalCode(entity.getPostalCode())
                .country(entity.getCountry())
                .isDefault(entity.getIsDefault())
                .build();
    }
}