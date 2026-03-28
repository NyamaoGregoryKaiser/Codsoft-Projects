package com.datavizpro.datavizpro.datasource;

import com.datavizpro.datavizpro.auth.Role;
import com.datavizpro.datavizpro.auth.User;
import com.datavizpro.datavizpro.auth.UserRepository;
import com.datavizpro.datavizpro.shared.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Testcontainers
@Transactional // Rollback changes after each test
class DataSourceServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop"); // Ensure schema is created for tests
        registry.add("spring.flyway.enabled", () -> "false"); // Disable Flyway for test schema management
    }

    @Autowired
    private DataSourceService dataSourceService;

    @Autowired
    private DataSourceRepository dataSourceRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        // Clear repositories for a clean slate
        dataSourceRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .roles(Set.of(Role.USER))
                .createdAt(LocalDateTime.now())
                .build());

        adminUser = userRepository.save(User.builder()
                .username("adminuser")
                .email("admin@example.com")
                .password("encodedPassword")
                .roles(Set.of(Role.ADMIN))
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Test
    void createDataSource_success() {
        DataSourceCreateUpdateDto dto = DataSourceCreateUpdateDto.builder()
                .name("New Test DB")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/test")
                .username("test")
                .password("test")
                .build();

        DataSourceDto createdDto = dataSourceService.createDataSource(dto, testUser.getUsername());

        assertThat(createdDto).isNotNull();
        assertThat(createdDto.getName()).isEqualTo("New Test DB");
        assertThat(createdDto.getOwnerUsername()).isEqualTo(testUser.getUsername());

        List<DataSource> sources = dataSourceRepository.findAll();
        assertThat(sources).hasSize(1);
        assertThat(sources.get(0).getName()).isEqualTo("New Test DB");
    }

    @Test
    void getDataSourceById_ownerAccess_success() {
        DataSource dataSource = dataSourceRepository.save(DataSource.builder()
                .name("Existing DB")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/existing")
                .owner(testUser)
                .createdAt(LocalDateTime.now())
                .build());

        DataSourceDto foundDto = dataSourceService.getDataSourceById(dataSource.getId());

        assertThat(foundDto).isNotNull();
        assertThat(foundDto.getId()).isEqualTo(dataSource.getId());
        assertThat(foundDto.getName()).isEqualTo("Existing DB");
    }

    @Test
    void getDataSourceById_notFound_throwsException() {
        assertThrows(ResourceNotFoundException.class, () -> dataSourceService.getDataSourceById(999L));
    }

    @Test
    void updateDataSource_success() {
        DataSource dataSource = dataSourceRepository.save(DataSource.builder()
                .name("Old Name")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/old")
                .owner(testUser)
                .createdAt(LocalDateTime.now())
                .build());

        DataSourceCreateUpdateDto updateDto = DataSourceCreateUpdateDto.builder()
                .name("Updated Name")
                .type(DataSourceType.MYSQL) // Change type
                .connectionString("jdbc:mysql://newhost:3306/newdb")
                .username("newuser")
                .password("newpass")
                .build();

        DataSourceDto updatedDto = dataSourceService.updateDataSource(dataSource.getId(), updateDto);

        assertThat(updatedDto).isNotNull();
        assertThat(updatedDto.getId()).isEqualTo(dataSource.getId());
        assertThat(updatedDto.getName()).isEqualTo("Updated Name");
        assertThat(updatedDto.getType()).isEqualTo(DataSourceType.MYSQL);
        // Note: Connection string/password won't be in DTO if sensitive fields are filtered.
    }

    @Test
    void deleteDataSource_success() {
        DataSource dataSource = dataSourceRepository.save(DataSource.builder()
                .name("To Be Deleted")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/delete")
                .owner(testUser)
                .createdAt(LocalDateTime.now())
                .build());

        dataSourceService.deleteDataSource(dataSource.getId());

        assertThat(dataSourceRepository.findById(dataSource.getId())).isEmpty();
    }

    @Test
    void isOwner_returnsTrue_forOwner() {
        DataSource dataSource = dataSourceRepository.save(DataSource.builder()
                .name("Owned DB")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/owned")
                .owner(testUser)
                .createdAt(LocalDateTime.now())
                .build());

        boolean isOwner = dataSourceService.isOwner(dataSource.getId(), testUser.getUsername());
        assertThat(isOwner).isTrue();
    }

    @Test
    void isOwner_returnsFalse_forNonOwner() {
        DataSource dataSource = dataSourceRepository.save(DataSource.builder()
                .name("Not Owned DB")
                .type(DataSourceType.POSTGRESQL)
                .connectionString("jdbc:postgresql://localhost:5432/notowned")
                .owner(adminUser) // Owned by admin
                .createdAt(LocalDateTime.now())
                .build());

        boolean isOwner = dataSourceService.isOwner(dataSource.getId(), testUser.getUsername()); // testUser tries to access
        assertThat(isOwner).isFalse();
    }

    @Test
    void isOwner_returnsFalse_forNonExistentDataSource() {
        boolean isOwner = dataSourceService.isOwner(999L, testUser.getUsername());
        assertThat(isOwner).isFalse();
    }
}