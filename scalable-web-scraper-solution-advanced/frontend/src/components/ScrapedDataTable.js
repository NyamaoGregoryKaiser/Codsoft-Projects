import React, { useState, useEffect } from 'react';

const ScrapedDataTable = ({ items }) => {
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (items.length > 0) {
      // Dynamically get all unique keys from the 'data' object across all items
      const allKeys = new Set();
      items.forEach(item => {
        Object.keys(item.data).forEach(key => allKeys.add(key));
      });
      // Add 'source_url' as a standard header
      setHeaders(['id', 'scraper_id', 'job_id', 'source_url', ...Array.from(allKeys)].filter(Boolean));
    } else {
      setHeaders([]);
    }
  }, [items]);

  if (!items || items.length === 0) {
    return <p className="text-gray-600">No scraped items to display for the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 border-b">
            {headers.map(header => (
              <th key={header} className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-r last:border-r-0">
                {header.replace(/_/g, ' ')} {/* Make headers more readable */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
              {headers.map(header => (
                <td key={`${item.id}-${header}`} className="py-2 px-4 text-sm text-gray-800 border-r last:border-r-0">
                  {header === 'id' && item.id}
                  {header === 'scraper_id' && item.scraper_id}
                  {header === 'job_id' && item.job_id}
                  {header === 'source_url' && item.source_url ? (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      Link
                    </a>
                  ) : (
                    item.data[header] || ''
                  )}
                  {item.data[header] && header !== 'source_url' && item.data[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScrapedDataTable;