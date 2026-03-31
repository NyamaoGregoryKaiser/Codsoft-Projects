package com.authsystem.entity;

import com.authsystem.util.RoleName;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.NaturalId;

/**
 * Represents a Role entity in the database.
 * Used for defining user permissions (e.g., ROLE_USER, ROLE_ADMIN).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @NaturalId // Ensures the role name is unique and can be used for natural ID lookup
    @Column(length = 60)
    private RoleName name;
}