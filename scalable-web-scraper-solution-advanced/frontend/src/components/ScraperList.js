import React from 'react';

const ScraperList = ({ scrapers, onEdit, onDelete, onRun, currentUser }) => {
  if (!scrapers || scrapers.length === 0) {
    return <p className="text-gray-600">No scrapers defined yet.</p>;
  }

  const canEditOrDelete = (scraper) => {
    return scraper.owner_id === currentUser?.id || currentUser?.role === 'admin';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Name</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Start URL</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Owner</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Created At</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {scrapers.map((scraper) => (
            <tr key={scraper.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="py-3 px-4">{scraper.name}</td>
              <td className="py-3 px-4 break-all max-w-xs"><a href={scraper.start_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{scraper.start_url}</a></td>
              <td className="py-3 px-4">{scraper.owner_id}</td> {/* In a real app, this would show owner's name/email */}
              <td className="py-3 px-4">{new Date(scraper.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4 space-x-2 flex">
                <button
                  onClick={() => onRun(scraper.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm disabled:opacity-50"
                >
                  Run Now
                </button>
                {canEditOrDelete(scraper) && (
                  <>
                    <button
                      onClick={() => onEdit(scraper)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(scraper.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScraperList;