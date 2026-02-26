package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    
    // Example of query optimization: fetch category eagerly to avoid N+1 problem
    @Query("SELECT p FROM Product p JOIN FETCH p.category c WHERE p.id = :productId")
    Product findByIdWithCategory(@Param("productId") Long productId);

    List<Product> findByNameContainingIgnoreCase(String name);
}