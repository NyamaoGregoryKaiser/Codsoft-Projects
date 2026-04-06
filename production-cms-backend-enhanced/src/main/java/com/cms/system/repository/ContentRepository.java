package com.cms.system.repository;

import com.cms.system.model.Content;
import com.cms.system.model.Content.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    Page<Content> findByStatus(ContentStatus status, Pageable pageable);
    Optional<Content> findBySlug(String slug);
    Page<Content> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Content> findByAuthorId(Long authorId, Pageable pageable);
    Page<Content> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}