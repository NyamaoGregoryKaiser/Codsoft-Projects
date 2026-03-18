export interface TransformData {
  features: number[][]; // 2D array of numbers
  feature_names?: string[]; // Optional array of strings
}

export interface TransformationResponse {
  status: string;
  data: TransformData;
}

export interface PredictionRequest {
  [key: string]: any; // Arbitrary JSON for input features
}

export interface PredictionResponse {
  status: string;
  data: {
    model_id: string;
    prediction: string;
    [key: string]: any; // Other prediction details
  };
}
```