```java
package com.mlutil.modelmanager.mapper;

import com.mlutil.modelmanager.dto.ModelDto;
import com.mlutil.modelmanager.dto.ModelRegisterRequest;
import com.mlutil.modelmanager.dto.ModelVersionDto;
import com.mlutil.modelmanager.entity.Model;
import com.mlutil.modelmanager.entity.ModelVersion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ModelMapper {
    ModelMapper INSTANCE = Mappers.getMapper(ModelMapper.class);

    ModelDto toModelDto(Model model);
    List<ModelDto> toModelDtoList(List<Model> models);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "versions", ignore = true)
    @Mapping(target = "owner", source = "owner") // Set owner from security context
    Model toModelEntity(ModelRegisterRequest request, String owner);

    @Mapping(source = "model.id", target = "modelId")
    ModelVersionDto toModelVersionDto(ModelVersion modelVersion);
    List<ModelVersionDto> toModelVersionDtoList(List<ModelVersion> modelVersions);
}
```