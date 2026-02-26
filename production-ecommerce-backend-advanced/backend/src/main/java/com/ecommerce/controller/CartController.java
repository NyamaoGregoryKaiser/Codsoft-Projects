package com.ecommerce.controller;

import com.ecommerce.dto.CartDTO;
import com.ecommerce.dto.CartItemDTO;
import com.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Shopping Cart", description = "APIs for managing user shopping carts")
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class CartController {

    private final CartService cartService;
    private final UserService userService; // To get current user ID

    private Long getCurrentUserId(UserDetails userDetails) {
        // In a real application, you'd fetch the User entity from a service using userDetails.getUsername()
        // and then get its ID. For simplicity, assuming username maps to a unique ID for now.
        // Or, implement a custom UserDetails that carries the ID.
        // For demonstration, let's just fetch the user to get the ID.
        return userService.getAllUsers().stream()
                .filter(u -> u.getUsername().equals(userDetails.getUsername()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found from security context"))
                .getId();
    }

    @Operation(summary = "Get user's shopping cart")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartDTO> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        CartDTO cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Add product to cart or update quantity if exists")
    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartDTO> addProductToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        Long userId = getCurrentUserId(userDetails);
        CartDTO updatedCart = cartService.addProductToCart(userId, productId, quantity);
        return new ResponseEntity<>(updatedCart, HttpStatus.OK);
    }

    @Operation(summary = "Update quantity of a product in the cart")
    @PutMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartDTO> updateCartItemQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {
        Long userId = getCurrentUserId(userDetails);
        CartDTO updatedCart = cartService.updateCartItemQuantity(userId, productId, quantity);
        return ResponseEntity.ok(updatedCart);
    }

    @Operation(summary = "Remove a product from the cart")
    @DeleteMapping("/remove/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> removeProductFromCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        Long userId = getCurrentUserId(userDetails);
        cartService.removeProductFromCart(userId, productId);
        return new ResponseEntity<>("Product removed from cart successfully", HttpStatus.NO_CONTENT);
    }

    @Operation(summary = "Clear the entire shopping cart")
    @DeleteMapping("/clear")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        cartService.clearCart(userId);
        return new ResponseEntity<>("Cart cleared successfully", HttpStatus.NO_CONTENT);
    }
}