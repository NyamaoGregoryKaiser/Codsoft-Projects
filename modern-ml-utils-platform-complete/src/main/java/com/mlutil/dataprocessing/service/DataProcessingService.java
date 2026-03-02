```java
package com.mlutil.dataprocessing.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mlutil.core.exception.ValidationException;
import com.mlutil.dataprocessing.dto.DataProcessingRequest;
import com.mlutil.dataprocessing.dto.DataProcessingResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.Map;

@Service
public class DataProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(DataProcessingService.class);
    private final ObjectMapper objectMapper;

    public DataProcessingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public DataProcessingResponse processData(DataProcessingRequest request) {
        String processingType = request.getProcessingType().toUpperCase();
        JsonNode inputData = request.getInputData();
        Map<String, String> params = request.getParams();

        JsonNode processedData;
        String message;

        switch (processingType) {
            case "MIN_MAX_SCALER":
                processedData = applyMinMaxScaler(inputData, params);
                message = "Min-Max scaling applied.";
                break;
            case "ONE_HOT_ENCODER":
                processedData = applyOneHotEncoder(inputData, params);
                message = "One-hot encoding applied.";
                break;
            case "TEXT_VECTORIZER":
                processedData = applyTextVectorizer(inputData, params);
                message = "Text vectorization simulated.";
                break;
            default:
                throw new ValidationException("Unsupported processing type: " + processingType);
        }
        logger.info("Data processed with type: {}", processingType);
        return new DataProcessingResponse(processingType, processedData, message);
    }

    private JsonNode applyMinMaxScaler(JsonNode inputData, Map<String, String> params) {
        if (!inputData.isArray()) {
            throw new ValidationException("Min-Max Scaler expects an array of numbers or objects with numeric fields.");
        }

        double min = params != null && params.containsKey("min") ? Double.parseDouble(params.get("min")) : 0.0;
        double max = params != null && params.containsKey("max") ? Double.parseDouble(params.get("max")) : 1.0;

        ArrayNode outputArray = objectMapper.createArrayNode();
        for (JsonNode item : inputData) {
            if (item.isNumber()) {
                double value = item.asDouble();
                double scaledValue = min + (value - getMinFromData(inputData)) * (max - min) / (getMaxFromData(inputData) - getMinFromData(inputData));
                outputArray.add(scaledValue);
            } else if (item.isObject()) {
                ObjectNode outputObject = objectMapper.createObjectNode();
                Iterator<Map.Entry<String, JsonNode>> fields = item.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    if (field.getValue().isNumber()) {
                        double value = field.getValue().asDouble();
                        // This scaling is simplistic, ideally, min/max for each feature would be known
                        double scaledValue = min + (value - getMinFromData(inputData)) * (max - min) / (getMaxFromData(inputData) - getMinFromData(inputData));
                        outputObject.put(field.getKey(), scaledValue);
                    } else {
                        outputObject.set(field.getKey(), field.getValue());
                    }
                }
                outputArray.add(outputObject);
            } else {
                outputArray.add(item); // Non-numeric values passed through
            }
        }
        return outputArray;
    }

    private double getMinFromData(JsonNode data) {
        // Placeholder for calculating min from the entire dataset or from pre-defined stats
        // In a real scenario, min/max would come from a trained scaler.
        if (data.isArray()) {
            double currentMin = Double.MAX_VALUE;
            for (JsonNode item : data) {
                if (item.isNumber()) {
                    currentMin = Math.min(currentMin, item.asDouble());
                } else if (item.isObject()) {
                    Iterator<JsonNode> values = item.elements();
                    while (values.hasNext()) {
                        JsonNode val = values.next();
                        if (val.isNumber()) {
                            currentMin = Math.min(currentMin, val.asDouble());
                        }
                    }
                }
            }
            return currentMin == Double.MAX_VALUE ? 0.0 : currentMin; // Default if no numbers
        }
        return 0.0;
    }

    private double getMaxFromData(JsonNode data) {
        // Placeholder for calculating max from the entire dataset or from pre-defined stats
        if (data.isArray()) {
            double currentMax = Double.MIN_VALUE;
            for (JsonNode item : data) {
                if (item.isNumber()) {
                    currentMax = Math.max(currentMax, item.asDouble());
                } else if (item.isObject()) {
                    Iterator<JsonNode> values = item.elements();
                    while (values.hasNext()) {
                        JsonNode val = values.next();
                        if (val.isNumber()) {
                            currentMax = Math.max(currentMax, val.asDouble());
                        }
                    }
                }
            }
            return currentMax == Double.MIN_VALUE ? 1.0 : currentMax; // Default if no numbers
        }
        return 1.0;
    }


    private JsonNode applyOneHotEncoder(JsonNode inputData, Map<String, String> params) {
        if (!inputData.isArray()) {
            throw new ValidationException("One-Hot Encoder expects an array of values or objects with categorical fields.");
        }

        String featureToEncode = params != null ? params.get("feature") : null;
        if (featureToEncode == null && inputData.get(0) != null && inputData.get(0).isObject()) {
            throw new ValidationException("For object inputs, 'feature' parameter is required for One-Hot Encoder.");
        }

        ArrayNode outputArray = objectMapper.createArrayNode();
        for (JsonNode item : inputData) {
            ObjectNode encodedObject = objectMapper.createObjectNode();

            if (item.isTextual()) { // Direct string input
                String category = item.asText();
                encodedObject.put(category, 1);
                // Other categories would be 0, but for simplicity, we only show the one that's 1
            } else if (item.isObject()) { // Object with specific feature
                Iterator<Map.Entry<String, JsonNode>> fields = item.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    if (field.getKey().equals(featureToEncode) && field.getValue().isTextual()) {
                        String category = field.getValue().asText();
                        encodedObject.put(featureToEncode + "_" + category, 1);
                    } else {
                        encodedObject.set(field.getKey(), field.getValue());
                    }
                }
            } else {
                // Pass through non-string/non-object types for simplicity
                outputArray.add(item);
                continue;
            }
            outputArray.add(encodedObject);
        }
        return outputArray;
    }

    private JsonNode applyTextVectorizer(JsonNode inputData, Map<String, String> params) {
        if (!inputData.isArray() || !inputData.get(0).isTextual()) {
            throw new ValidationException("Text Vectorizer expects an array of strings.");
        }

        // Simulate tokenization and vectorization
        ArrayNode outputArray = objectMapper.createArrayNode();
        for (JsonNode item : inputData) {
            String text = item.asText();
            // A real vectorizer would convert text to a dense or sparse vector
            // For simplicity, we'll return a mock hash or length
            ObjectNode vectorResult = objectMapper.createObjectNode();
            vectorResult.put("original_text", text);
            vectorResult.put("vector_length", text.length()); // Mock vector representation
            vectorResult.put("mock_embedding_1", Math.random());
            vectorResult.put("mock_embedding_2", Math.random());
            outputArray.add(vectorResult);
        }
        return outputArray;
    }
}
```