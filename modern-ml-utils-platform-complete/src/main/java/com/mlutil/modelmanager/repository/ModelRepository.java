```java
package com.mlutil.modelmanager.repository;

import com.mlutil.modelmanager.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModelRepository extends JpaRepository<Model, Long> {
    Optional<Model> findByName(String name);
    boolean existsByName(String name);
}
```