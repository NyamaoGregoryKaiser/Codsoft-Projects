import React, { useState, useEffect } from 'react';
import api from '../api';
import JobList from '../components/JobList';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jobs/');
      // Sort by latest jobs first
      setJobs(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to fetch scraping jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh jobs every 10 seconds
    const intervalId = setInterval(fetchJobs, 10000); 
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Recent Scraping Jobs</h2>
        <JobList jobs={jobs} currentUser={user} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => window.location.href = '/scrapers'} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Scrapers
          </button>
          <button 
            onClick={() => window.location.href = '/data'} 
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            View Scraped Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;