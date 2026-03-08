package com.example.authsystem.mapper;

import com.example.authsystem.dto.AuthResponse;
import com.example.authsystem.dto.UserDto;
import com.example.authsystem.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user.getRoles()))")
    UserDto toUserDto(User user);

    List<UserDto> toUserDtoList(List<User> users);

    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user.getRoles()))")
    AuthResponse toAuthResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateUserFromDto(UserDto userDto, @MappingTarget User user);


    default Set<String> mapRolesToStrings(Set<com.example.authsystem.model.Role> roles) {
        if (roles == null) {
            return Set.of();
        }
        return roles.stream()
                .map(com.example.authsystem.model.Role::getName)
                .map(Enum::name)
                .collect(Collectors.toSet());
    }
}