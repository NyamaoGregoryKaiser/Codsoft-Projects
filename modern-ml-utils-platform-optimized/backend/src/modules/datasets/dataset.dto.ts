export interface CreateDatasetDTO {
  userId: string;
  name: string;
  description?: string;
  filePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface UpdateDatasetDTO {
  name?: string;
  description?: string;
  // filePath and other file-related fields are generally not updated directly here
  // Instead, a new upload process would typically create a new dataset entry or update the file system directly.
}