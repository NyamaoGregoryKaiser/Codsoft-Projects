package com.example.authsystem.mapper;

import com.example.authsystem.dto.TaskDto;
import com.example.authsystem.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TaskMapper {
    @Mapping(source = "user.id", target = "userId")
    TaskDto toDto(Task task);

    @Mapping(target = "user", ignore = true) // User will be set in service layer
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Task toEntity(TaskDto taskDto);

    List<TaskDto> toDtoList(List<Task> tasks);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateTaskFromDto(TaskDto taskDto, @MappingTarget Task task);
}