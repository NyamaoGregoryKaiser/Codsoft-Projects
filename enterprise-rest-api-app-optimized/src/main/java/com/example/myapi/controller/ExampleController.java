```java
package com.example.myapi.controller;

import com.example.myapi.model.Example;
import com.example.myapi.repository.ExampleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/example")
public class ExampleController {

    @Autowired
    private ExampleRepository exampleRepository;

    @GetMapping
    public List<Example> getAllExamples() {
        return exampleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Example> getExampleById(@PathVariable Long id) {
        Optional<Example> example = exampleRepository.findById(id);
        return example.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Example> createExample(@RequestBody Example example) {
        Example savedExample = exampleRepository.save(example);
        return new ResponseEntity<>(savedExample, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Example> updateExample(@PathVariable Long id, @RequestBody Example updatedExample) {
        Optional<Example> existingExample = exampleRepository.findById(id);
        if (existingExample.isPresent()) {
            updatedExample.setId(id); // Ensure ID remains the same
            Example savedExample = exampleRepository.save(updatedExample);
            return ResponseEntity.ok(savedExample);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExample(@PathVariable Long id) {
        if (exampleRepository.existsById(id)) {
            exampleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
```