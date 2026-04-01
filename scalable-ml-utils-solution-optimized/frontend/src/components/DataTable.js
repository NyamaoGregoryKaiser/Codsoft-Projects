```javascript
import React from 'react';

const DataTable = ({ columns, data, title, className = '' }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No data available.</div>;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {String(row[col])} {/* Ensure data is rendered as string */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
```