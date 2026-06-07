```java
package com.example.authsystem.service;

import com.example.authsystem.dto.ProductDto;
import com.example.authsystem.entity.Product;
import com.example.authsystem.exception.CustomExceptions;
import com.example.authsystem.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Product> findProductById(UUID id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(ProductDto productDto) {
        if (productRepository.findByName(productDto.getName()).isPresent()) {
            throw new CustomExceptions.UserAlreadyExistsException("Product with name " + productDto.getName() + " already exists.");
        }
        Product product = productDto.toEntity();
        product.setId(null); // Ensure ID is generated on creation
        Product savedProduct = productRepository.save(product);
        log.info("Created new product with ID: {}", savedProduct.getId());
        return savedProduct;
    }

    @Transactional
    public Product updateProduct(UUID id, ProductDto productDto) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Product not found with id: " + id));

        existingProduct.setName(productDto.getName());
        existingProduct.setDescription(productDto.getDescription());
        existingProduct.setPrice(productDto.getPrice());
        existingProduct.setStockQuantity(productDto.getStockQuantity());

        Product updatedProduct = productRepository.save(existingProduct);
        log.info("Updated product with ID: {}", updatedProduct.getId());
        return updatedProduct;
    }

    @Transactional
    public void deleteProduct(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new CustomExceptions.ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
        log.info("Deleted product with ID: {}", id);
    }
}
```