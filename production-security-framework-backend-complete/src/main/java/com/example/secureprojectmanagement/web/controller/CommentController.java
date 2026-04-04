package com.example.secureprojectmanagement.web.controller;

import com.example.secureprojectmanagement.model.Comment;
import com.example.secureprojectmanagement.model.User;
import com.example.secureprojectmanagement.service.CommentService;
import com.example.secureprojectmanagement.service.CustomUserDetailsService;
import com.example.secureprojectmanagement.web.dto.CommentDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CustomUserDetailsService userDetailsService;

    // --- API Endpoints ---
    @GetMapping("/api/projects/{projectId}/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentDTO>> getCommentsByTaskIdAPI(@PathVariable Long projectId, @PathVariable Long taskId, @AuthenticationPrincipal User currentUser) {
        List<CommentDTO> comments = commentService.getCommentsByTaskId(projectId, taskId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}")
    public ResponseEntity<CommentDTO> getCommentByIdAPI(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId, @AuthenticationPrincipal User currentUser) {
        Comment comment = commentService.getCommentById(projectId, taskId, commentId);
        return ResponseEntity.ok(convertToDTO(comment));
    }

    @PostMapping("/api/projects/{projectId}/tasks/{taskId}/comments")
    public ResponseEntity<CommentDTO> createCommentAPI(@PathVariable Long projectId, @PathVariable Long taskId, @Valid @RequestBody CommentDTO commentDTO, @AuthenticationPrincipal User currentUser) {
        Comment createdComment = commentService.createComment(projectId, taskId, commentDTO, currentUser.getId());
        return new ResponseEntity<>(convertToDTO(createdComment), HttpStatus.CREATED);
    }

    @PutMapping("/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}")
    public ResponseEntity<CommentDTO> updateCommentAPI(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId, @Valid @RequestBody CommentDTO commentDTO, @AuthenticationPrincipal User currentUser) {
        Comment updatedComment = commentService.updateComment(projectId, taskId, commentId, commentDTO);
        return ResponseEntity.ok(convertToDTO(updatedComment));
    }

    @DeleteMapping("/api/projects/{projectId}/tasks/{taskId}/comments/{commentId}")
    public ResponseEntity<Void> deleteCommentAPI(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId, @AuthenticationPrincipal User currentUser) {
        commentService.deleteComment(projectId, taskId, commentId);
        return ResponseEntity.noContent().build();
    }

    // --- UI Endpoints ---

    // Display comments and form to add new comment for a task
    @GetMapping("/projects/{projectId}/tasks/{taskId}/comments")
    public String listComments(@PathVariable Long projectId, @PathVariable Long taskId, Model model, Principal principal) {
        model.addAttribute("projectId", projectId);
        model.addAttribute("taskId", taskId);
        model.addAttribute("comments", commentService.getCommentsByTaskId(projectId, taskId));
        model.addAttribute("commentDTO", new CommentDTO());
        model.addAttribute("currentUser", userDetailsService.loadUserByUsername(principal.getName()));
        return "comments";
    }

    // Handle creation of a new comment from UI form
    @PostMapping("/projects/{projectId}/tasks/{taskId}/comments")
    public String createComment(@PathVariable Long projectId, @PathVariable Long taskId,
                                @Valid @ModelAttribute("commentDTO") CommentDTO commentDTO,
                                BindingResult result,
                                Principal principal,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("projectId", projectId);
            model.addAttribute("taskId", taskId);
            model.addAttribute("comments", commentService.getCommentsByTaskId(projectId, taskId));
            return "comments";
        }
        User currentUser = userDetailsService.loadUserByUsername(principal.getName());
        commentService.createComment(projectId, taskId, commentDTO, currentUser.getId());
        redirectAttributes.addFlashAttribute("message", "Comment added successfully!");
        return "redirect:/projects/" + projectId + "/tasks/" + taskId + "/comments";
    }

    // Handle deletion of a comment from UI
    @PostMapping("/projects/{projectId}/tasks/{taskId}/comments/{commentId}/delete")
    public String deleteComment(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId, Principal principal, RedirectAttributes redirectAttributes) {
        commentService.deleteComment(projectId, taskId, commentId); // Auth check in service
        redirectAttributes.addFlashAttribute("message", "Comment deleted successfully!");
        return "redirect:/projects/" + projectId + "/tasks/" + taskId + "/comments";
    }

    private CommentDTO convertToDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        return dto;
    }
}