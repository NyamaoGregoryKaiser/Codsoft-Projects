```javascript
import React, { useState } from 'react';

const ScraperResultViewer = ({ resultData }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!resultData) {
    return <p className="text-gray-500">No result data to display.</p>;
  }

  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <ul className="ml-4 list-disc list-inside">
          {Object.entries(value).map(([key, val]) => (
            <li key={key}>
              <span className="font-semibold">{key}:</span> {renderValue(val)}
            </li>
          ))}
        </ul>
      );
    }
    return String(value);
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg max-h-[500px] overflow-auto">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Scraped Data</h3>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {showRaw ? 'View Formatted' : 'View Raw JSON'}
        </button>
      </div>

      {showRaw ? (
        <pre className="whitespace-pre-wrap break-all bg-gray-50 p-3 rounded-md text-sm text-gray-800 overflow-x-auto">
          {JSON.stringify(resultData, null, 2)}
        </pre>
      ) : (
        <div className="text-sm text-gray-700">
          <ul className="list-disc list-inside space-y-2">
            {Object.entries(resultData).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold">{key}:</span> {renderValue(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScraperResultViewer;
```