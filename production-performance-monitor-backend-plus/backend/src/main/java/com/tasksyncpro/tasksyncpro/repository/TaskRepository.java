```java
package com.tasksyncpro.tasksyncpro.repository;

import com.tasksyncpro.tasksyncpro.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssignedToId(Long assignedToId);
}
```