package com.mlutil.service;

import com.mlutil.dto.PredictionRequest;
import com.mlutil.dto.PredictionResponse;
import com.mlutil.exception.BadRequestException;
import com.mlutil.exception.ResourceNotFoundException;
import com.mlutil.model.Model;
import com.mlutil.model.ModelVersion;
import com.mlutil.repository.ModelRepository;
import com.mlutil.repository.ModelVersionRepository;
import com.mlutil.util.ModelStorageUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionService {

    private final ModelRepository modelRepository;
    private final ModelVersionRepository modelVersionRepository;
    private final ModelStorageUtil modelStorageUtil;

    // In a real system, this would be a sophisticated model loading/inference engine
    // For demonstration, we'll store "loaded models" as simple strings or dummy objects
    private final ConcurrentHashMap<String, String> loadedModels = new ConcurrentHashMap<>(); // Key: modelId_versionNumber, Value: "Model instance"

    @PostConstruct
    public void initializeModels() {
        // In a real system, you might load all active models on startup
        log.info("Initializing prediction service. Pre-loading active models...");
        // For this example, we'll just ensure the model storage directory exists.
        try {
            modelStorageUtil.ensureModelStorageDirExists();
        } catch (IOException e) {
            log.error("Failed to ensure model storage directory exists: {}", e.getMessage());
        }
    }

    /**
     * Performs a prediction using a specified model version.
     * If versionNumber is null, the active version is used.
     * @param request PredictionRequest containing modelId, optional versionNumber, and inputData.
     * @return PredictionResponse with the result.
     */
    @Cacheable(value = "predictions", key = "#request.modelId + '_' + (#request.versionNumber != null ? #request.versionNumber : 'active') + '_' + #request.inputData.hashCode()")
    public PredictionResponse predict(PredictionRequest request) {
        UUID modelId = request.getModelId();
        Integer versionNumber = request.getVersionNumber();
        Map<String, Object> inputData = request.getInputData();

        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("Model", "id", modelId));

        ModelVersion modelVersion;
        if (versionNumber != null) {
            modelVersion = modelVersionRepository.findByModelIdAndVersionNumber(modelId, versionNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Model Version", "modelId and versionNumber", modelId + "/" + versionNumber));
        } else {
            modelVersion = modelVersionRepository.findByModelIdAndIsActiveTrue(modelId)
                    .orElseThrow(() -> new ResourceNotFoundException("Active Model Version", "modelId", modelId));
        }

        String modelKey = modelId + "_" + modelVersion.getVersionNumber();
        String loadedModel = loadedModels.computeIfAbsent(modelKey, k -> loadModelForInference(modelVersion));

        // Simulate prediction logic
        Map<String, Object> predictionResult = simulatePrediction(inputData, loadedModel);

        log.info("Prediction made for model {} version {}. Input: {}, Result: {}",
                model.getName(), modelVersion.getVersionNumber(), inputData, predictionResult);

        return new PredictionResponse(
                modelId,
                modelVersion.getVersionNumber(),
                predictionResult,
                "Prediction successful for model " + model.getName()
        );
    }

    /**
     * Simulates loading a model into memory for inference.
     * In a real scenario, this would deserialize a model file (e.g., ONNX, PMML, joblib)
     * and prepare it for execution.
     */
    private String loadModelForInference(ModelVersion modelVersion) {
        try {
            Path modelFilePath = modelStorageUtil.getModelFilePath(modelVersion.getStoragePath());
            // Simulate loading logic
            // E.g., model = ModelLoader.load(modelFilePath);
            // For now, just confirm file existence and return a dummy representation
            if (!modelFilePath.toFile().exists()) {
                throw new IOException("Model file not found at " + modelFilePath);
            }
            log.info("Simulating loading model {} version {} from {}", modelVersion.getModel().getName(), modelVersion.getVersionNumber(), modelFilePath);
            return "Loaded_Model_Instance_v" + modelVersion.getVersionNumber();
        } catch (IOException e) {
            log.error("Failed to load model {} version {} from {}: {}", modelVersion.getModel().getName(), modelVersion.getVersionNumber(), modelVersion.getStoragePath(), e.getMessage());
            throw new BadRequestException("Failed to load model for inference: " + e.getMessage());
        }
    }

    /**
     * Simulates actual prediction logic.
     * This is a placeholder; real ML models would process the input.
     */
    private Map<String, Object> simulatePrediction(Map<String, Object> inputData, String loadedModelInstance) {
        Map<String, Object> result = new HashMap<>();
        // Example: simple rule-based prediction based on input or just returning fixed value
        result.put("prediction", "class_" + (inputData.getOrDefault("feature_1", 0).hashCode() % 3));
        result.put("confidence", 0.95);
        result.put("model_used", loadedModelInstance);
        result.put("input_echo", inputData);
        return result;
    }
}