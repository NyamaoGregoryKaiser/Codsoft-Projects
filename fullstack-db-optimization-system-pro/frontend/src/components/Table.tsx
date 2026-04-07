import React from 'react';

interface TableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
  }[];
  onRowClick?: (row: T) => void;
  getKey: (row: T) => React.Key;
  isLoading?: boolean;
  emptyMessage?: string;
}

function Table<T>({ data, columns, onRowClick, getKey, isLoading = false, emptyMessage = "No data available." }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50 transition-colors duration-150" : ""}
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 ${column.className || ''}`}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : (row[column.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;