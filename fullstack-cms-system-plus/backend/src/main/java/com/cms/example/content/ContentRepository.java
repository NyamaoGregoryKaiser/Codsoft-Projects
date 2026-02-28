```java
package com.cms.example.content;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    Page<Content> findByStatus(ContentStatus status, Pageable pageable);
    Page<Content> findByType(ContentType type, Pageable pageable);
    Page<Content> findByAuthorId(Long authorId, Pageable pageable);
    Page<Content> findByCategoryId(Long categoryId, Pageable pageable);
    Optional<Content> findBySlugAndStatus(String slug, ContentStatus status);
    boolean existsByTitle(String title);
    boolean existsBySlug(String slug);
}
```