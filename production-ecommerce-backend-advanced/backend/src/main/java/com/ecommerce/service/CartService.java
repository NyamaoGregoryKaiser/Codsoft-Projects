package com.ecommerce.service;

import com.ecommerce.dto.CartDTO;
import com.ecommerce.dto.CartItemDTO;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CartDTO getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));
        return mapToDTO(cart);
    }

    @Transactional
    public CartDTO addProductToCart(Long userId, Long productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive.");
        }
        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Not enough stock for product: " + product.getName());
        }

        Cart cart = user.getCart();
        if (cart == null) {
            cart = Cart.builder().user(user).build();
            user.setCart(cart); // Ensure bidirectional link
            cart = cartRepository.save(cart);
        }

        Optional<CartItem> existingCartItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        CartItem cartItem;
        if (existingCartItem.isPresent()) {
            cartItem = existingCartItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            cartItemRepository.save(cartItem);
            log.info("Updated quantity for product {} in cart {}. New quantity: {}", productId, cart.getId(), cartItem.getQuantity());
        } else {
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(quantity)
                    .build();
            cart.addCartItem(cartItem); // Add to cart's item list for cascade/consistency
            cartItemRepository.save(cartItem);
            log.info("Added product {} to cart {} with quantity {}", productId, cart.getId(), quantity);
        }

        return mapToDTO(cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId)));
    }

    @Transactional
    public CartDTO updateCartItemQuantity(Long userId, Long productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative.");
        }
        if (product.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Not enough stock for product: " + product.getName());
        }

        Cart cart = user.getCart();
        if (cart == null) {
            throw new ResourceNotFoundException("Cart", "userId", userId);
        }

        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));

        if (quantity == 0) {
            cart.removeCartItem(cartItem); // Remove from cart's item list
            cartItemRepository.delete(cartItem);
            log.info("Removed product {} from cart {} as quantity is 0", productId, cart.getId());
        } else {
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
            log.info("Updated product {} quantity in cart {} to {}", productId, cart.getId(), quantity);
        }

        return mapToDTO(cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId)));
    }

    @Transactional
    public void removeProductFromCart(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Cart cart = user.getCart();
        if (cart == null) {
            throw new ResourceNotFoundException("Cart", "userId", userId);
        }

        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "productId", productId));

        cart.removeCartItem(cartItem);
        cartItemRepository.delete(cartItem);
        log.info("Removed product {} from cart {}", productId, cart.getId());
    }

    @Transactional
    public void clearCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Cart cart = user.getCart();
        if (cart == null) {
            throw new ResourceNotFoundException("Cart", "userId", userId);
        }
        cartItemRepository.deleteAll(cart.getCartItems());
        cart.getCartItems().clear(); // Clear the collection in the entity
        cartRepository.save(cart); // Save to ensure the change is persisted, though deleteAll is often enough.
        log.info("Cleared cart for user {}", userId);
    }

    private CartDTO mapToDTO(Cart cart) {
        Set<CartItemDTO> itemDTOS = cart.getCartItems().stream()
                .map(item -> CartItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImage(item.getProduct().getImageUrl())
                        .unitPrice(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .subTotal(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .addedAt(item.getAddedAt())
                        .build())
                .collect(Collectors.toSet());

        BigDecimal totalAmount = itemDTOS.stream()
                .map(CartItemDTO::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartDTO.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .cartItems(itemDTOS)
                .totalAmount(totalAmount)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}