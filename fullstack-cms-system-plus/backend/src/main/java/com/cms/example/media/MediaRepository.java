```java
package com.cms.example.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    // Add custom query methods if needed, e.g., find by file type, find by filename
}
```