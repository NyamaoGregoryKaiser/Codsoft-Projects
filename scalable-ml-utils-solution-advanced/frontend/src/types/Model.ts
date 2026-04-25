export interface Model {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  versions?: ModelVersion[];
}

export interface ModelVersion {
  id: string;
  modelId: string;
  versionNumber: number;
  storagePath: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PredictionRequest {
  modelId: string;
  versionNumber?: number; // Optional
  inputData: Record<string, any>;
}

export interface PredictionResponse {
  modelId: string;
  versionNumber: number;
  predictionResult: Record<string, any>;
  message: string;
}