```java
package com.cms.example.media;

import com.cms.example.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;

    @Value("${file.upload-dir}") // Configure this in application.yml
    private String uploadDir;

    @Transactional
    public Media uploadFile(MultipartFile file) throws IOException {
        // Ensure upload directory exists
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = uploadPath.resolve(fileName);

        // Copy file to target location
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // Save media metadata to database
        Media media = Media.builder()
                .fileName(fileName)
                .fileType(file.getContentType())
                .url("/uploads/" + fileName) // This URL would be served by the web server or a CDN
                .altText(originalFilename) // Can be updated later by user
                .fileSize(file.getSize())
                .build();

        return mediaRepository.save(media);
    }

    @Transactional(readOnly = true)
    public Media getMediaById(Long id) {
        return mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Media> getAllMedia() {
        return mediaRepository.findAll();
    }

    @Transactional
    public void deleteMedia(Long id) throws IOException {
        Media media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));

        // Delete file from filesystem
        Path filePath = Paths.get(uploadDir).resolve(media.getFileName()).normalize();
        Files.deleteIfExists(filePath);

        // Delete metadata from database
        mediaRepository.delete(media);
    }
}
```