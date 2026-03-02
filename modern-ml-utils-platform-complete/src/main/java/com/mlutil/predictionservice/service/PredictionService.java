```java
package com.mlutil.predictionservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mlutil.core.exception.ResourceNotFoundException;
import com.mlutil.modelmanager.dto.ModelVersionDto;
import com.mlutil.modelmanager.service.ModelService;
import com.mlutil.predictionservice.dto.PredictionRequest;
import com.mlutil.predictionservice.dto.PredictionResponse;
import com.mlutil.predictionservice.entity.PredictionLog;
import com.mlutil.predictionservice.repository.PredictionLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);
    private final ModelService modelService;
    private final PredictionLogRepository predictionLogRepository;
    private final ObjectMapper objectMapper;

    public PredictionService(ModelService modelService, PredictionLogRepository predictionLogRepository, ObjectMapper objectMapper) {
        this.modelService = modelService;
        this.predictionLogRepository = predictionLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PredictionResponse makePrediction(Long modelId, PredictionRequest request, String userId, HttpServletRequest httpRequest) {
        long startTime = System.currentTimeMillis();

        // 1. Get the active model version
        ModelVersionDto activeVersion = modelService.getActiveModelVersion(modelId);
        logger.debug("Making prediction for model {} (version {})", activeVersion.getModelId(), activeVersion.getVersionNumber());

        // 2. Simulate ML inference (replace with actual ML model loading/API call)
        JsonNode simulatedPrediction = simulateMlInference(activeVersion, request.getInputData());

        long endTime = System.currentTimeMillis();
        long latency = endTime - startTime;

        // 3. Log the prediction
        logPrediction(activeVersion, request.getInputData(), simulatedPrediction, userId, httpRequest, latency);

        return new PredictionResponse(
                modelService.getModelById(activeVersion.getModelId()).getName(),
                activeVersion.getVersionNumber(),
                simulatedPrediction,
                latency
        );
    }

    /**
     * Placeholder for actual ML model inference.
     * In a real system, this would:
     * - Load the model from `activeVersion.getModelPath()` (e.g., S3, local file system)
     * - Deserialize/load the model based on `activeVersion.getFileType()`
     * - Preprocess `inputData` if necessary (could use DataProcessingService)
     * - Invoke the model's predict method
     * - Format the output as JSON
     *
     * For this example, it returns a mock prediction.
     */
    private JsonNode simulateMlInference(ModelVersionDto activeVersion, JsonNode inputData) {
        // Example: Add a simple mock prediction based on input or model type
        ObjectNode predictionResult = objectMapper.createObjectNode();
        predictionResult.put("prediction_id", UUID.randomUUID().toString());
        predictionResult.put("model_used", activeVersion.getModel().getName());
        predictionResult.put("model_version", activeVersion.getVersionNumber());
        predictionResult.put("status", "SUCCESS");

        // Simple mock logic: if input has 'features', return a mock score
        if (inputData.has("features") && inputData.get("features").isObject()) {
            // Simulate a probability score
            predictionResult.put("score", Math.random());
            predictionResult.put("class", Math.random() > 0.5 ? "Positive" : "Negative");
        } else {
            predictionResult.put("message", "Mock prediction for input: " + inputData.toString());
        }

        return predictionResult;
    }

    private void logPrediction(ModelVersionDto activeVersion, JsonNode requestPayload, JsonNode responsePayload,
                               String userId, HttpServletRequest httpRequest, Long latency) {
        PredictionLog log = new PredictionLog();
        log.setModelId(activeVersion.getModelId());
        log.setModelVersionNumber(activeVersion.getVersionNumber());
        log.setRequestPayload(requestPayload.toString());
        log.setResponsePayload(responsePayload.toString());
        log.setUserId(userId != null ? userId : "anonymous");
        log.setClientIp(httpRequest.getRemoteAddr());
        log.setPredictedAt(LocalDateTime.now());
        log.setLatencyMs(latency);
        predictionLogRepository.save(log);
        logger.info("Prediction logged for model {} (version {}). Latency: {}ms", activeVersion.getModelId(), activeVersion.getVersionNumber(), latency);
    }

    public PredictionLog getPredictionLogById(Long id) {
        return predictionLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction Log", "id", id));
    }

    public List<PredictionLog> getPredictionLogsForModel(Long modelId) {
        return predictionLogRepository.findByModelIdOrderByPredictedAtDesc(modelId);
    }
}
```