import ApiError from '../../shared/errors/ApiError';
import httpStatus from 'http-status';

interface DataRow {
  [key: string]: any;
}

export const oneHotEncode = (data: DataRow[], column: string): DataRow[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const uniqueValues = Array.from(new Set(data.map(row => row[column])));
  const encodedData: DataRow[] = data.map(row => {
    const newRow = { ...row };
    uniqueValues.forEach(val => {
      newRow[`${column}_${val}`] = (row[column] === val ? 1 : 0);
    });
    delete newRow[column]; // Optionally remove the original column
    return newRow;
  });

  return encodedData;
};

export const minMaxScale = (data: DataRow[], column: string): DataRow[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const values = data.map(row => row[column]).filter(v => typeof v === 'number');
  if (values.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Column '${column}' contains no numeric values for scaling.`);
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    // Avoid division by zero if all values are the same
    return data.map(row => ({
      ...row,
      [`${column}_scaled`]: (typeof row[column] === 'number' ? 0 : row[column]),
    }));
  }

  const scaledData: DataRow[] = data.map(row => {
    const newRow = { ...row };
    if (typeof row[column] === 'number') {
      newRow[`${column}_scaled`] = (row[column] - min) / (max - min);
    } else {
      newRow[`${column}_scaled`] = row[column]; // Keep non-numeric values as is
    }
    // Optionally delete original column: delete newRow[column];
    return newRow;
  });

  return scaledData;
};