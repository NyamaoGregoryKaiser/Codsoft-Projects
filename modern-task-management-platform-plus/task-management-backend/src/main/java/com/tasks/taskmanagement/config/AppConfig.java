```java
package com.tasks.taskmanagement.config;

import com.tasks.taskmanagement.util.MapperUtil;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT) // Strict matching for DTOs to Entities
                .setFieldMatchingEnabled(true)
                .setSkipNullEnabled(true); // Skip null fields during mapping
        return modelMapper;
    }

    @Bean
    public MapperUtil mapperUtil(ModelMapper modelMapper) {
        return new MapperUtil(modelMapper);
    }
}
```