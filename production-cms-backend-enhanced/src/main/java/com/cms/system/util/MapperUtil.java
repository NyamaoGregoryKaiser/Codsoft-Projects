package com.cms.system.util;

import com.cms.system.dto.category.CategoryDto;
import com.cms.system.dto.content.ContentDto;
import com.cms.system.dto.user.UserDto;
import com.cms.system.model.Category;
import com.cms.system.model.Content;
import com.cms.system.model.Role;
import com.cms.system.model.User;

import java.util.stream.Collectors;

public class MapperUtil {

    public static UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setEnabled(user.isEnabled());
        dto.setRoles(user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet()));
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public static CategoryDto toCategoryDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }

    public static ContentDto toContentDto(Content content) {
        ContentDto dto = new ContentDto();
        dto.setId(content.getId());
        dto.setTitle(content.getTitle());
        dto.setBody(content.getBody());
        dto.setSlug(content.getSlug());
        dto.setStatus(content.getStatus());
        dto.setCreatedAt(content.getCreatedAt());
        dto.setUpdatedAt(content.getUpdatedAt());

        if (content.getCategory() != null) {
            dto.setCategory(toCategoryDto(content.getCategory()));
        }
        if (content.getAuthor() != null) {
            // Avoid circular reference by creating a simplified UserDto for author
            UserDto authorDto = new UserDto();
            authorDto.setId(content.getAuthor().getId());
            authorDto.setUsername(content.getAuthor().getUsername());
            authorDto.setEmail(content.getAuthor().getEmail());
            dto.setAuthor(authorDto);
        }
        return dto;
    }
}