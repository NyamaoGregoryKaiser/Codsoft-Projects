```java
package com.cms.example.content;

import com.cms.example.category.Category;
import com.cms.example.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contents")
public class Content {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(unique = true)
    private String slug; // URL-friendly version of the title

    @Lob // For larger text content
    @Column(nullable = false)
    private String body;

    private String featuredImage; // URL or path to featured image

    @Enumerated(EnumType.STRING)
    private ContentStatus status; // DRAFT, PUBLISHED, ARCHIVED

    private ContentType type; // POST, PAGE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime publishedAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ContentStatus.DRAFT;
        }
        if (this.type == null) {
            this.type = ContentType.POST;
        }
        if (this.slug == null || this.slug.isEmpty()) {
            this.slug = title.toLowerCase().replace(" ", "-").replaceAll("[^a-z0-9-]", "");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.status == ContentStatus.PUBLISHED && this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
        if (this.slug == null || this.slug.isEmpty()) {
            this.slug = title.toLowerCase().replace(" ", "-").replaceAll("[^a-z0-9-]", "");
        }
    }
}
```