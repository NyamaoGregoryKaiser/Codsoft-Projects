export interface MLModel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version: string;
  model_path?: string; // Optional field
  status: 'draft' | 'training' | 'ready' | 'deployed' | 'archived';
  metadata: Record<string, any>; // JSON object
  created_at: string;
  updated_at: string;
}

export interface CreateModelPayload {
  name: string;
  description: string;
  version?: string;
  model_path?: string;
  status?: 'draft' | 'training' | 'ready' | 'deployed' | 'archived';
  metadata?: Record<string, any>;
}

export interface UpdateModelPayload {
  name?: string;
  description?: string;
  version?: string;
  model_path?: string;
  status?: 'draft' | 'training' | 'ready' | 'deployed' | 'archived';
  metadata?: Record<string, any>;
}
```