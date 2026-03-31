package com.authsystem.repository;

import com.authsystem.entity.Role;
import com.authsystem.util.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the Role entity.
 * Provides standard CRUD operations and a custom method to find a role by its name.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Finds a role by its enumerated name.
     *
     * @param roleName The name of the role (e.g., ROLE_USER, ROLE_ADMIN).
     * @return An Optional containing the found Role, or empty if not found.
     */
    Optional<Role> findByName(RoleName roleName);
}