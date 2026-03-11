package com.dataviz.datavisualizationtool.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataQueryResponse {
    private List<Map<String, Object>> data;
    private String message;
    private boolean success;
}