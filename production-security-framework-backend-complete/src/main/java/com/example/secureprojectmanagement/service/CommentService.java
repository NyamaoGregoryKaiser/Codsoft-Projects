package com.example.secureprojectmanagement.service;

import com.example.secureprojectmanagement.exception.ResourceNotFoundException;
import com.example.secureprojectmanagement.model.Comment;
import com.example.secureprojectmanagement.model.Task;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.repository.CommentRepository;
import com.example.secureprojectmanagement.repository.TaskRepository;
import com.example.secureprojectmanagement.web.dto.CommentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final CustomUserDetailsService userDetailsService;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and (@projectService.isProjectOwner(#projectId, authentication.principal.id) or @taskService.isTaskAssignee(#taskId, authentication.principal.id))")
    public List<Comment> getCommentsByTaskId(Long projectId, Long taskId) {
        return commentRepository.findByTaskId(taskId);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and (@projectService.isProjectOwner(#projectId, authentication.principal.id) or @taskService.isTaskAssignee(#taskId, authentication.principal.id) or @commentService.isCommentOwner(#commentId, authentication.principal.id))")
    @Cacheable(value = "comments", key = "#commentId")
    public Comment getCommentById(Long projectId, Long taskId, Long commentId) {
        return commentRepository.findById(commentId)
                .filter(comment -> comment.getTask().getId().equals(taskId))
                .filter(comment -> comment.getTask().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'USER') and (@projectService.isProjectOwner(#projectId, authentication.principal.id) or @taskService.isTaskAssignee(#taskId, authentication.principal.id))")
    @CacheEvict(value = "comments", allEntries = true) // Evict all comments on creation
    public Comment createComment(Long projectId, Long taskId, CommentDTO commentDTO, Long userId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId + " in project: " + projectId));
        User user = userDetailsService.loadUserById(userId);

        Comment comment = new Comment();
        comment.setTask(task);
        comment.setUser(user);
        comment.setContent(commentDTO.getContent());
        return commentRepository.save(comment);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN') or @commentService.isCommentOwner(#commentId, authentication.principal.id)")
    @CachePut(value = "comments", key = "#commentId") // Update specific comment in cache
    public Comment updateComment(Long projectId, Long taskId, Long commentId, CommentDTO commentDTO) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getTask().getId().equals(taskId))
                .filter(c -> c.getTask().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        comment.setContent(commentDTO.getContent());
        return commentRepository.save(comment);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN') or @commentService.isCommentOwner(#commentId, authentication.principal.id)")
    @CacheEvict(value = "comments", key = "#commentId") // Evict specific comment from cache
    public void deleteComment(Long projectId, Long taskId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getTask().getId().equals(taskId))
                .filter(c -> c.getTask().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        commentRepository.delete(comment);
    }

    // Helper method for authorization (used in @PreAuthorize)
    public boolean isCommentOwner(Long commentId, Long userId) {
        return commentRepository.findById(commentId)
                .map(comment -> comment.getUser().getId().equals(userId))
                .orElse(false);
    }
}