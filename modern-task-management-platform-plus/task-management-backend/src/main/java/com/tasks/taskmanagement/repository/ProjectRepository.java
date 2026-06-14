```java
package com.tasks.taskmanagement.repository;

import com.tasks.taskmanagement.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOwnerId(UUID ownerId);
    boolean existsByIdAndOwnerId(UUID projectId, UUID ownerId);
}
```