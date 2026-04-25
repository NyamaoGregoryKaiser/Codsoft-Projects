package com.mlutil.util;

import com.mlutil.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ModelStorageUtil {

    @Value("${app.model-storage-path}")
    private String modelStoragePath;

    private Path rootLocation;

    @PostConstruct
    public void init() throws IOException {
        this.rootLocation = Paths.get(modelStoragePath).toAbsolutePath().normalize();
        ensureModelStorageDirExists();
        log.info("Model storage root directory initialized: {}", rootLocation);
    }

    public void ensureModelStorageDirExists() throws IOException {
        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
            log.info("Created model storage directory: {}", rootLocation);
        } else if (!Files.isDirectory(rootLocation)) {
            throw new IOException("Model storage path exists but is not a directory: " + rootLocation);
        }
    }

    /**
     * Saves a model file to the storage location.
     * @param modelId The ID of the model.
     * @param versionNumber The version number of the model.
     * @param file The MultipartFile to store.
     * @return The relative path to the stored file.
     * @throws IOException If file operation fails.
     */
    public String saveModelFile(UUID modelId, Integer versionNumber, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        String originalFilename = Objects.requireNonNull(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFilename);
        String filename = String.format("model_%s_v%d.%s", modelId.toString(), versionNumber, fileExtension);
        Path destinationFile = this.rootLocation.resolve(filename);

        Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
        log.debug("Model file saved: {}", destinationFile.toString());
        return destinationFile.getFileName().toString(); // Return just the filename for storage_path
    }

    /**
     * Retrieves the full path to a stored model file.
     * @param relativePath The relative path (filename) of the model file.
     * @return The absolute Path to the model file.
     */
    public Path getModelFilePath(String relativePath) {
        return rootLocation.resolve(relativePath);
    }

    /**
     * Deletes a model file from the storage location.
     * @param relativePath The relative path (filename) of the model file.
     * @throws IOException If file deletion fails.
     */
    public void deleteModelFile(String relativePath) throws IOException {
        Path filePath = getModelFilePath(relativePath);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.debug("Deleted model file: {}", filePath);
        } else {
            log.warn("Attempted to delete non-existent model file: {}", filePath);
        }
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1);
    }
}