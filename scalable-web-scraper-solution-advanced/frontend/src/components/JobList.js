import React from 'react';
import { Link } from 'react-router-dom';

const JobList = ({ jobs, currentUser }) => {
  if (!jobs || jobs.length === 0) {
    return <p className="text-gray-600">No scraping jobs found.</p>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800 animate-pulse';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Job ID</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Scraper ID</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Status</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Results</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Started</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Completed</th>
            <th className="py-3 px-4 text-left text-gray-700 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="py-3 px-4">{job.id}</td>
              <td className="py-3 px-4">
                <Link to={`/scrapers?id=${job.scraper_id}`} className="text-blue-600 hover:underline">
                  {job.scraper_id}
                </Link>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </td>
              <td className="py-3 px-4">{job.result_count}</td>
              <td className="py-3 px-4">
                {job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}
              </td>
              <td className="py-3 px-4">
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}
              </td>
              <td className="py-3 px-4">
                {job.status === 'completed' && job.result_count > 0 && (
                  <Link
                    to={`/data?job_id=${job.id}`}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm"
                  >
                    View Data
                  </Link>
                )}
                {job.status === 'failed' && job.error_message && (
                  <span className="text-red-500 text-sm italic" title={job.error_message}>Error</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobList;