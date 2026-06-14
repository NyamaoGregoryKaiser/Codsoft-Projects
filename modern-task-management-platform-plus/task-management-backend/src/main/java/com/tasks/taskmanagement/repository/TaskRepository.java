```java
package com.tasks.taskmanagement.repository;

import com.tasks.taskmanagement.entity.Task;
import com.tasks.taskmanagement.entity.Task.Priority;
import com.tasks.taskmanagement.entity.Task.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByAssigneeId(UUID assigneeId);
    List<Task> findByProjectId(UUID projectId);
    List<Task> findByStatus(Status status);
    List<Task> findByPriority(Priority priority);
    List<Task> findByDueDateBefore(LocalDateTime date);

    // Custom query to find tasks by assignee and optionally by project or status
    @Query("SELECT t FROM Task t WHERE t.assignee.id = :assigneeId " +
           "AND (:projectId IS NULL OR t.project.id = :projectId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "ORDER BY t.dueDate ASC")
    List<Task> findTasksByAssigneeAndFilters(
            @Param("assigneeId") UUID assigneeId,
            @Param("projectId") UUID projectId,
            @Param("status") Status status
    );

    // Check if task belongs to a user (as assignee or via project ownership, if relevant for authorization)
    @Query("SELECT COUNT(t) > 0 FROM Task t WHERE t.id = :taskId AND " +
           "(t.assignee.id = :userId OR t.project.owner.id = :userId)")
    boolean isTaskOwnedOrAssignedByUser(@Param("taskId") UUID taskId, @Param("userId") UUID userId);

    @Query("SELECT t FROM Task t JOIN t.tags tag WHERE tag.id = :tagId")
    List<Task> findByTagId(@Param("tagId") UUID tagId);
}
```