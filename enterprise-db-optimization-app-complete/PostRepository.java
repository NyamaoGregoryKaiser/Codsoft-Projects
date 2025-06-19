```java
package com.example.dboptimizer.repository;

import com.example.dboptimizer.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    // Add custom queries for optimization here (e.g., using @Query)
}
```