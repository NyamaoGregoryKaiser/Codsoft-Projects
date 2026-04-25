/**
 * Represents metadata for a column within a dataset.
 */
export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date'; // Basic types, can be expanded
}

/**
 * Represents a dataset object.
 */
export interface Dataset {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  data: object[]; // Array of JSON objects, where each object is a row
  columnMetadata: ColumnMetadata[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a simplified dataset for display in lists, without the full data.
 */
export type DatasetListItem = Omit<Dataset, 'data'>;