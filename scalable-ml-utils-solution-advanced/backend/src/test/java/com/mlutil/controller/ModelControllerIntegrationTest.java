package com.mlutil.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mlutil.auth.AuthService;
import com.mlutil.dto.AuthRequest;
import com.mlutil.dto.AuthResponse;
import com.mlutil.dto.ModelDto;
import com.mlutil.dto.ModelVersionDto;
import com.mlutil.model.Model;
import com.mlutil.repository.ModelRepository;
import com.mlutil.repository.ModelVersionRepository;
import com.mlutil.repository.UserRepository;
import com.mlutil.util.ModelStorageUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD) // Cleans context including DB before each test
class ModelControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpassword");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("app.model-storage-path", () -> "./test-ml-models-integration");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ModelRepository modelRepository;

    @Autowired
    private ModelVersionRepository modelVersionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private ModelStorageUtil modelStorageUtil; // To clean up files

    private String adminToken;
    private String userToken;

    @BeforeEach
    @Transactional
    void setup() throws Exception {
        // Ensure storage directory is clean
        Path testModelStoragePath = Paths.get("./test-ml-models-integration");
        if (Files.exists(testModelStoragePath)) {
            Files.walk(testModelStoragePath)
                    .filter(Files::isRegularFile)
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
        }
        modelStorageUtil.ensureModelStorageDirExists(); // Re-create if deleted

        // Clear existing data (for DirtiesContext)
        modelVersionRepository.deleteAll();
        modelRepository.deleteAll();
        userRepository.deleteAll();

        // Register and authenticate admin user
        authService.registerUser(new AuthRequest("admin", "password"), Set.of("ROLE_USER", "ROLE_ADMIN"));
        AuthResponse adminAuth = authService.authenticateUser(new AuthRequest("admin", "password"));
        adminToken = adminAuth.getToken();

        // Register and authenticate regular user
        authService.registerUser(new AuthRequest("user", "password"), Set.of("ROLE_USER"));
        AuthResponse userAuth = authService.authenticateUser(new AuthRequest("user", "password"));
        userToken = userAuth.getToken();
    }

    @Test
    void getAllModels_PublicAccess_Success() throws Exception {
        ModelDto newModel = new ModelDto();
        newModel.setName("Model A");
        newModel.setDescription("Description A");

        // Create a model using admin role
        mockMvc.perform(post("/api/v1/models")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newModel)))
                .andExpect(status().isCreated());

        // Get all models without authentication (public access)
        mockMvc.perform(get("/api/v1/models")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Model A"));
    }

    @Test
    void createModel_AdminRole_Success() throws Exception {
        ModelDto newModel = new ModelDto();
        newModel.setName("Test Model");
        newModel.setDescription("A description");

        mockMvc.perform(post("/api/v1/models")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newModel)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Model"));

        assertThat(modelRepository.findByName("Test Model")).isPresent();
    }

    @Test
    void createModel_UserRole_Forbidden() throws Exception {
        ModelDto newModel = new ModelDto();
        newModel.setName("Test Model");
        newModel.setDescription("A description");

        mockMvc.perform(post("/api/v1/models")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newModel)))
                .andExpect(status().isForbidden());

        assertThat(modelRepository.findByName("Test Model")).isNotPresent();
    }

    @Test
    void updateModel_AdminRole_Success() throws Exception {
        // Create a model first
        Model model = modelRepository.save(new Model("Old Name", "Old Desc"));
        ModelDto updateDto = new ModelDto();
        updateDto.setName("New Name");
        updateDto.setDescription("New Description");

        mockMvc.perform(put("/api/v1/models/{id}", model.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));

        assertThat(modelRepository.findById(model.getId()).get().getName()).isEqualTo("New Name");
    }

    @Test
    void deleteModel_AdminRole_Success() throws Exception {
        Model model = modelRepository.save(new Model("Model to Delete", "Desc"));
        // Create a dummy file to ensure deletion logic is called
        Path dummyFilePath = modelStorageUtil.getModelFilePath(model.getId() + "_v1.pkl");
        Files.write(dummyFilePath, "dummy content".getBytes());
        modelVersionRepository.save(new com.mlutil.model.ModelVersion(model, 1, dummyFilePath.getFileName().toString()));


        mockMvc.perform(delete("/api/v1/models/{id}", model.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(modelRepository.findById(model.getId())).isNotPresent();
        assertThat(Files.exists(dummyFilePath)).isFalse();
    }

    @Test
    void uploadModelVersion_AdminRole_Success() throws Exception {
        Model model = modelRepository.save(new Model("Model For Versions", "Desc"));
        MockMultipartFile file = new MockMultipartFile("file", "model.pkl", MediaType.APPLICATION_OCTET_STREAM_VALUE, "test data".getBytes());

        MvcResult result = mockMvc.perform(multipart("/api/v1/models/{modelId}/versions", model.getId())
                        .file(file)
                        .param("accuracy", "0.95")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.accuracy").value(0.95))
                .andReturn();

        ModelVersionDto versionDto = objectMapper.readValue(result.getResponse().getContentAsString(), ModelVersionDto.class);
        assertThat(modelVersionRepository.findByModelIdAndVersionNumber(model.getId(), 1)).isPresent();
        assertThat(Files.exists(modelStorageUtil.getModelFilePath(versionDto.getStoragePath()))).isTrue();
    }

    @Test
    void activateModelVersion_AdminRole_Success() throws Exception {
        Model model = modelRepository.save(new Model("Model to Activate", "Desc"));
        com.mlutil.model.ModelVersion v1 = modelVersionRepository.save(new com.mlutil.model.ModelVersion(model, 1, "v1.pkl"));
        com.mlutil.model.ModelVersion v2 = modelVersionRepository.save(new com.mlutil.model.ModelVersion(model, 2, "v2.pkl"));
        v1.setIsActive(true);
        modelVersionRepository.save(v1); // v1 is active initially

        mockMvc.perform(put("/api/v1/models/{modelId}/versions/{versionNumber}/activate", model.getId(), 2)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(2))
                .andExpect(jsonPath("$.isActive").value(true));

        assertThat(modelVersionRepository.findByModelIdAndVersionNumber(model.getId(), 2).get().getIsActive()).isTrue();
        assertThat(modelVersionRepository.findByModelIdAndVersionNumber(model.getId(), 1).get().getIsActive()).isFalse();
    }
}