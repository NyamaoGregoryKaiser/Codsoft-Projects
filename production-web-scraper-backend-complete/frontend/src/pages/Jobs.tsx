import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../auth/AuthProvider';

interface Job {
  id: number;
  scraper_id: number;
  owner_id: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  log_output: string | null;
  created_at: string;
}

export const Jobs: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const loadJobs = async () => {
        try {
          const response = await api.fetchJobs();
          setJobs(response.data);
        } catch (err: any) {
          console.error('Failed to fetch jobs:', err);
          setError(err.response?.data?.detail || 'Failed to load jobs.');
        } finally {
          setLoading(false);
        }
      };

      loadJobs();
      // Optional: Poll for job status updates for real-time feel
      const interval = setInterval(loadJobs, 5000); 
      return () => clearInterval(interval);

    } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError("Please log in to view jobs.");
    }
  }, [isAuthenticated, authLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading jobs...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Scraping Jobs</h1>
      {jobs.length === 0 ? (
        <p className="text-gray-600 text-center">No scraping jobs found. Trigger one from a scraper's detail page!</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scraper ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <Link to={`/scrapers/${job.scraper_id}`} className="text-indigo-600 hover:text-indigo-900">
                        {job.scraper_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/jobs/${job.id}/results`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View Results
                    </Link>
                    {/* Optionally add "View Log" or other actions */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```
---