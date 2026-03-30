import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import ScrapedDataTable from '../components/ScrapedDataTable';
import { useAuth } from '../hooks/useAuth';

const ScrapedDataPage = () => {
  const [scrapedItems, setScrapedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrapers, setScrapers] = useState([]);
  const [selectedScraperId, setSelectedScraperId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState([]); // To populate job filter dropdown

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialScraperId = queryParams.get('scraper_id');
  const initialJobId = queryParams.get('job_id');
  const { user } = useAuth();

  useEffect(() => {
    // Set initial filters from URL params
    if (initialScraperId) setSelectedScraperId(initialScraperId);
    if (initialJobId) setSelectedJobId(initialJobId);

    // Fetch all scrapers for the dropdown
    const fetchAllScrapers = async () => {
      try {
        const response = await api.get('/scrapers/');
        setScrapers(response.data);
      } catch (err) {
        console.error("Error fetching all scrapers:", err);
      }
    };
    fetchAllScrapers();
  }, [initialScraperId, initialJobId]);

  useEffect(() => {
    const fetchJobsForScraper = async () => {
      if (selectedScraperId) {
        try {
          const response = await api.get(`/jobs/?scraper_id=${selectedScraperId}`);
          setJobs(response.data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (err) {
          console.error(`Error fetching jobs for scraper ${selectedScraperId}:`, err);
          setJobs([]); // Clear jobs if error
        }
      } else {
        setJobs([]);
      }
    };
    fetchJobsForScraper();
  }, [selectedScraperId]);

  const fetchScrapedItems = async () => {
    setLoading(true);
    setError(null);
    let url = '/data/';
    const params = [];
    if (selectedScraperId) params.push(`scraper_id=${selectedScraperId}`);
    if (selectedJobId) params.push(`job_id=${selectedJobId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    try {
      const response = await api.get(url);
      setScrapedItems(response.data);
    } catch (err) {
      console.error("Error fetching scraped items:", err);
      setError("Failed to fetch scraped items. You might not have permission or there's no data.");
      setScrapedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapedItems();
  }, [selectedScraperId, selectedJobId]); // Refetch when filters change

  const handleScraperChange = (e) => {
    setSelectedScraperId(e.target.value);
    setSelectedJobId(''); // Reset job filter when scraper changes
  };

  const handleJobChange = (e) => {
    setSelectedJobId(e.target.value);
  };

  if (loading) return <div className="text-center p-4">Loading scraped data...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Scraped Data</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex space-x-4">
        <div className="flex-1">
          <label htmlFor="scraperFilter" className="block text-gray-700 text-sm font-bold mb-2">
            Filter by Scraper:
          </label>
          <select
            id="scraperFilter"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedScraperId}
            onChange={handleScraperChange}
          >
            <option value="">All Scrapers</option>
            {scrapers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (ID: {s.id})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="jobFilter" className="block text-gray-700 text-sm font-bold mb-2">
            Filter by Job:
          </label>
          <select
            id="jobFilter"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedJobId}
            onChange={handleJobChange}
            disabled={!selectedScraperId}
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                Job {job.id} - {new Date(job.created_at).toLocaleString()} ({job.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Scraped Items ({scrapedItems.length})</h2>
        <ScrapedDataTable items={scrapedItems} />
      </div>
    </div>
  );
};

export default ScrapedDataPage;