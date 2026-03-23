```java
package com.tasksyncpro.tasksyncpro.repository;

import com.tasksyncpro.tasksyncpro.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findByMembers_Id(Long memberId);
}
```