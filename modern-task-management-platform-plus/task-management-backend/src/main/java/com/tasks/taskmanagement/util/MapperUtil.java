```java
package com.tasks.taskmanagement.util;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MapperUtil {

    private final ModelMapper modelMapper;

    public <S, D> D map(S source, Class<D> destinationType) {
        return modelMapper.map(source, destinationType);
    }

    public <S, D> List<D> mapList(List<S> sourceList, Class<D> destinationType) {
        return sourceList.stream()
                .map(source -> modelMapper.map(source, destinationType))
                .collect(Collectors.toList());
    }

    public <S, D> Set<D> mapSet(Set<S> sourceSet, Class<D> destinationType) {
        return sourceSet.stream()
                .map(source -> modelMapper.map(source, destinationType))
                .collect(Collectors.toSet());
    }
}
```