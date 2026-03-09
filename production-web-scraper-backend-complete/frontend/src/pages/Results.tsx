import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../auth/AuthProvider';

interface ScrapedData {
  id: number;
  job_id: number;
  scraper_id: number;
  data: { [key: string]: any };
  scraped_at: string;
}

export const Results: React.FC = () => {
  const { jobId, scraperId } = useParams<{ jobId?: string; scraperId?: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [results, setResults] = useState<ScrapedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = jobId ? `Results for Job ID: ${jobId}` : `Results for Scraper ID: ${scraperId}`;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
        const loadResults = async () => {
            try {
                let response;
                if (jobId) {
                    response = await api.fetchResultsByJob(parseInt(jobId));
                } else if (scraperId) {
                    response = await api.fetchResultsByScraper(parseInt(scraperId));
                } else {
                    setError('No job ID or scraper ID provided.');
                    return;
                }
                setResults(response.data);
            } catch (err: any) {
                console.error('Failed to fetch results:', err);
                setError(err.response?.data?.detail || 'Failed to load results.');
            } finally {
                setLoading(false);
            }
        };
        loadResults();
    } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError("Please log in to view results.");
    }
  }, [jobId, scraperId, isAuthenticated, authLoading]);

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  const getTableHeaders = () => {
    if (results.length === 0) return [];
    // Get all unique keys from all data objects
    const allKeys = new Set<string>();
    results.forEach(result => {
      Object.keys(result.data).forEach(key => allKeys.add(key));
    });
    return ['ID', 'Scraped At', ...Array.from(allKeys)];
  };

  const headers = getTableHeaders();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{title}</h1>
      <div className="mb-4">
        {jobId && (
            <Link to={`/jobs`} className="text-indigo-600 hover:underline mr-4">
                &larr; Back to Jobs
            </Link>
        )}
         {scraperId && (
            <Link to={`/scrapers/${scraperId}`} className="text-indigo-600 hover:underline">
                &larr; Back to Scraper
            </Link>
        )}
      </div>

      {results.length === 0 ? (
        <p className="text-gray-600 text-center">No scraped data found for this {jobId ? 'job' : 'scraper'}.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(result.scraped_at).toLocaleString()}
                  </td>
                  {headers.slice(2).map((headerKey, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {result.data[headerKey] !== undefined ? String(result.data[headerKey]) : 'N/A'}
                    </td>
                  ))}
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