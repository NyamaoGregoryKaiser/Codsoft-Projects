package com.ecommerce.controller;

import com.ecommerce.dto.CategoryDTO;
import com.ecommerce.dto.ProductDTO;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.RoleRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.AppConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Use application-test.yml
@Transactional // Rollback changes after each test
@DisplayName("ProductController Integration Tests")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Category testCategory;
    private Product testProduct;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        // Ensure roles exist
        Role adminRole = roleRepository.findByName(AppConstants.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(null, AppConstants.ADMIN)));
        Role userRole = roleRepository.findByName(AppConstants.USER)
                .orElseGet(() -> roleRepository.save(new Role(null, AppConstants.USER)));

        // Create test category
        testCategory = Category.builder()
                .name("Test Category")
                .description("Category for integration tests")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        categoryRepository.save(testCategory);

        // Create test product
        testProduct = Product.builder()
                .name("Test Product")
                .description("Product for integration tests")
                .price(BigDecimal.valueOf(100.00))
                .stockQuantity(10)
                .imageUrl("http://example.com/test.jpg")
                .category(testCategory)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        productRepository.save(testProduct);

        // Create an admin user and set authentication context
        User adminUser = User.builder()
                .username("admin_test")
                .email("admin_test@example.com")
                .password(passwordEncoder.encode("password"))
                .roles(new HashSet<>(Collections.singletonList(adminRole)))
                .build();
        userRepository.save(adminUser);

        Set<GrantedAuthority> adminAuthorities = new HashSet<>();
        adminAuthorities.add(new SimpleGrantedAuthority(AppConstants.ADMIN));
        adminAuthorities.add(new SimpleGrantedAuthority(AppConstants.USER)); // Admin usually has user roles too
        UsernamePasswordAuthenticationToken adminAuthToken =
                new UsernamePasswordAuthenticationToken(adminUser.getUsername(), adminUser.getPassword(), adminAuthorities);
        SecurityContextHolder.getContext().setAuthentication(adminAuthToken); // Temporarily set for this test method.
        // In real JWT integration test, you would get a token from auth endpoint

        // Create a regular user
        User regularUser = User.builder()
                .username("user_test")
                .email("user_test@example.com")
                .password(passwordEncoder.encode("password"))
                .roles(new HashSet<>(Collections.singletonList(userRole)))
                .build();
        userRepository.save(regularUser);

        Set<GrantedAuthority> userAuthorities = new HashSet<>();
        userAuthorities.add(new SimpleGrantedAuthority(AppConstants.USER));
        UsernamePasswordAuthenticationToken userAuthToken =
                new UsernamePasswordAuthenticationToken(regularUser.getUsername(), regularUser.getPassword(), userAuthorities);
        // SecurityContextHolder.getContext().setAuthentication(userAuthToken); // Not set globally, used WithMockUser for simplicity
    }

    @Test
    @WithMockUser(username = "admin_test", roles = { "ADMIN" })
    void givenProductDTO_whenCreateProductAsAdmin_thenReturnsCreatedProduct() throws Exception {
        ProductDTO newProductDTO = ProductDTO.builder()
                .name("New Product")
                .description("New product description")
                .price(BigDecimal.valueOf(200.00))
                .stockQuantity(20)
                .imageUrl("http://example.com/new.jpg")
                .categoryId(testCategory.getId())
                .build();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProductDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Product")))
                .andExpect(jsonPath("$.price", is(200.00)));
    }

    @Test
    @WithMockUser(username = "user_test", roles = { "USER" })
    void givenProductDTO_whenCreateProductAsUser_thenReturnsForbidden() throws Exception {
        ProductDTO newProductDTO = ProductDTO.builder()
                .name("New Product Forbidden")
                .description("New product description")
                .price(BigDecimal.valueOf(200.00))
                .stockQuantity(20)
                .imageUrl("http://example.com/new_forbidden.jpg")
                .categoryId(testCategory.getId())
                .build();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProductDTO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenProductId_whenGetProductById_thenReturnsProduct() throws Exception {
        mockMvc.perform(get("/api/products/{id}", testProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testProduct.getId().intValue())))
                .andExpect(jsonPath("$.name", is(testProduct.getName())));
    }

    @Test
    void givenInvalidProductId_whenGetProductById_thenReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/products/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void whenGetAllProducts_thenReturnsPaginatedProducts() throws Exception {
        mockMvc.perform(get("/api/products?pageNo=0&pageSize=10&sortBy=id&sortDir=asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1))) // Only testProduct initially
                .andExpect(jsonPath("$.totalElements", is(1)));
    }

    @Test
    @WithMockUser(username = "admin_test", roles = { "ADMIN" })
    void givenExistingProductAndDTO_whenUpdateProductAsAdmin_thenReturnsUpdatedProduct() throws Exception {
        ProductDTO updatedProductDTO = ProductDTO.builder()
                .name("Updated Product Name")
                .description("Updated description")
                .price(BigDecimal.valueOf(150.00))
                .stockQuantity(15)
                .imageUrl("http://example.com/updated.jpg")
                .categoryId(testCategory.getId())
                .build();

        mockMvc.perform(put("/api/products/{id}", testProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedProductDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testProduct.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Updated Product Name")))
                .andExpect(jsonPath("$.price", is(150.00)));
    }

    @Test
    @WithMockUser(username = "admin_test", roles = { "ADMIN" })
    void givenInvalidProductId_whenUpdateProductAsAdmin_thenReturnsNotFound() throws Exception {
        ProductDTO updatedProductDTO = ProductDTO.builder()
                .name("Non Existent Product")
                .description("Description")
                .price(BigDecimal.valueOf(10.00))
                .stockQuantity(1)
                .imageUrl("url")
                .categoryId(testCategory.getId())
                .build();

        mockMvc.perform(put("/api/products/{id}", 999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedProductDTO)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin_test", roles = { "ADMIN" })
    void givenProductId_whenDeleteProductAsAdmin_thenReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", testProduct.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/{id}", testProduct.getId()))
                .andExpect(status().isNotFound()); // Verify it's deleted
    }

    @Test
    @WithMockUser(username = "user_test", roles = { "USER" })
    void givenProductId_whenDeleteProductAsUser_thenReturnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", testProduct.getId()))
                .andExpect(status().isForbidden());
    }
}