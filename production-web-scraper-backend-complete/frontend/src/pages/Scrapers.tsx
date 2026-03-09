import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../auth/AuthProvider';

interface Scraper {
  id: number;
  name: string;
  description: string;
  target_url: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export const Scrapers: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const loadScrapers = async () => {
        try {
          const response = await api.fetchScrapers();
          setScrapers(response.data);
        } catch (err: any) {
          console.error('Failed to fetch scrapers:', err);
          setError(err.response?.data?.detail || 'Failed to load scrapers.');
        } finally {
          setLoading(false);
        }
      };
      loadScrapers();
    } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError("Please log in to view scrapers.");
    }
  }, [isAuthenticated, authLoading]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this scraper?')) {
      try {
        await api.deleteScraper(id);
        setScrapers(scrapers.filter(scraper => scraper.id !== id));
      } catch (err: any) {
        console.error('Failed to delete scraper:', err);
        setError(err.response?.data?.detail || 'Failed to delete scraper.');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading scrapers...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Scrapers</h1>
      <div className="flex justify-end mb-4">
        <Link to="/scrapers/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200">
          Create New Scraper
        </Link>
      </div>
      {scrapers.length === 0 ? (
        <p className="text-gray-600 text-center">No scrapers found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scrapers.map((scraper) => (
            <div key={scraper.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{scraper.name}</h2>
              <p className="text-gray-700 mb-4 truncate">{scraper.target_url}</p>
              <p className="text-gray-600 text-sm mb-4">{scraper.description || 'No description provided.'}</p>
              <div className="flex space-x-2">
                <Link to={`/scrapers/${scraper.id}`} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200">
                  View/Edit
                </Link>
                <button
                  onClick={() => handleDelete(scraper.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```
---