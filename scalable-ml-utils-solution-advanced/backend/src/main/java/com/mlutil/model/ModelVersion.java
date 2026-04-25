package com.mlutil.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "model_versions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"model_id", "version_number"})
})
@Data
@NoArgsConstructor
public class ModelVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private Model model;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    private Double accuracy;
    private Double precision;
    private Double recall;
    @Column(name = "f1_score")
    private Double f1Score;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Indicates if this version is the currently active one for inference

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public ModelVersion(Model model, Integer versionNumber, String storagePath) {
        this.model = model;
        this.versionNumber = versionNumber;
        this.storagePath = storagePath;
    }
}