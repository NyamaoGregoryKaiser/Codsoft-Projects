package com.ecommerce.service;

import com.ecommerce.dto.ProductDTO;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category testCategory;
    private Product testProduct1;
    private Product testProduct2;
    private ProductDTO productDTO;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder()
                .id(1L)
                .name("Electronics")
                .description("Electronic devices")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testProduct1 = Product.builder()
                .id(101L)
                .name("Laptop Pro X")
                .description("Powerful laptop")
                .price(BigDecimal.valueOf(1200.00))
                .stockQuantity(50)
                .imageUrl("http://example.com/laptop.jpg")
                .category(testCategory)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testProduct2 = Product.builder()
                .id(102L)
                .name("Smartphone Z")
                .description("Latest smartphone")
                .price(BigDecimal.valueOf(800.00))
                .stockQuantity(120)
                .imageUrl("http://example.com/smartphone.jpg")
                .category(testCategory)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        productDTO = ProductDTO.builder()
                .name("Smartwatch A")
                .description("Fitness tracker and smartwatch")
                .price(BigDecimal.valueOf(250.00))
                .stockQuantity(200)
                .imageUrl("http://example.com/smartwatch.jpg")
                .categoryId(1L)
                .build();
    }

    @Test
    void givenProductDTO_whenCreateProduct_thenReturnsProductDTO() {
        // Given
        when(categoryRepository.findById(anyLong())).thenReturn(Optional.of(testCategory));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct1);

        // When
        ProductDTO createdProduct = productService.createProduct(productDTO);

        // Then
        assertThat(createdProduct).isNotNull();
        assertThat(createdProduct.getName()).isEqualTo(testProduct1.getName());
        assertThat(createdProduct.getCategoryName()).isEqualTo(testCategory.getName());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void givenInvalidCategoryId_whenCreateProduct_thenThrowsResourceNotFoundException() {
        // Given
        when(categoryRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(productDTO));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void givenProductId_whenGetProductById_thenReturnsProductDTO() {
        // Given
        when(productRepository.findById(101L)).thenReturn(Optional.of(testProduct1));

        // When
        ProductDTO foundProduct = productService.getProductById(101L);

        // Then
        assertThat(foundProduct).isNotNull();
        assertThat(foundProduct.getId()).isEqualTo(101L);
        assertThat(foundProduct.getName()).isEqualTo("Laptop Pro X");
        verify(productRepository, times(1)).findById(101L);
    }

    @Test
    void givenInvalidProductId_whenGetProductById_thenThrowsResourceNotFoundException() {
        // Given
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
        verify(productRepository, times(1)).findById(999L);
    }

    @Test
    void givenValidParams_whenGetAllProducts_thenReturnsPageOfProductDTOs() {
        // Given
        List<Product> products = Arrays.asList(testProduct1, testProduct2);
        Pageable pageable = PageRequest.of(0, 10, Sort.by("id").ascending());
        Page<Product> productPage = new PageImpl<>(products, pageable, products.size());

        when(productRepository.findAll(pageable)).thenReturn(productPage);

        // When
        Page<ProductDTO> result = productService.getAllProducts(0, 10, "id", "asc", null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Laptop Pro X");
        verify(productRepository, times(1)).findAll(pageable);
    }

    @Test
    void givenValidProductIdAndDTO_whenUpdateProduct_thenReturnsUpdatedProductDTO() {
        // Given
        ProductDTO updateDTO = ProductDTO.builder()
                .name("Laptop Pro X Updated")
                .description("Updated description")
                .price(BigDecimal.valueOf(1250.00))
                .stockQuantity(45)
                .imageUrl("http://example.com/laptop_updated.jpg")
                .categoryId(1L)
                .build();

        when(productRepository.findById(101L)).thenReturn(Optional.of(testProduct1));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct1); // Mock save to return the modified existing product

        // When
        ProductDTO updatedProduct = productService.updateProduct(101L, updateDTO);

        // Then
        assertThat(updatedProduct).isNotNull();
        assertThat(updatedProduct.getId()).isEqualTo(101L);
        assertThat(updatedProduct.getName()).isEqualTo("Laptop Pro X Updated");
        assertThat(updatedProduct.getPrice()).isEqualTo(BigDecimal.valueOf(1250.00));
        verify(productRepository, times(1)).findById(101L);
        verify(categoryRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void givenInvalidProductId_whenUpdateProduct_thenThrowsResourceNotFoundException() {
        // Given
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> productService.updateProduct(999L, productDTO));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void givenProductId_whenDeleteProduct_thenDeletesProduct() {
        // Given
        when(productRepository.findById(101L)).thenReturn(Optional.of(testProduct1));
        doNothing().when(productRepository).delete(testProduct1);

        // When
        productService.deleteProduct(101L);

        // Then
        verify(productRepository, times(1)).findById(101L);
        verify(productRepository, times(1)).delete(testProduct1);
    }

    @Test
    void givenInvalidProductId_whenDeleteProduct_thenThrowsResourceNotFoundException() {
        // Given
        when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> productService.deleteProduct(999L));
        verify(productRepository, never()).delete(any(Product.class));
    }

    @Test
    void givenSearchQuery_whenSearchProducts_thenReturnsListOfProductDTOs() {
        // Given
        String query = "laptop";
        when(productRepository.findByNameContainingIgnoreCase(query)).thenReturn(List.of(testProduct1));

        // When
        List<ProductDTO> results = productService.searchProducts(query);

        // Then
        assertThat(results).isNotNull();
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Laptop Pro X");
        verify(productRepository, times(1)).findByNameContainingIgnoreCase(query);
    }
}