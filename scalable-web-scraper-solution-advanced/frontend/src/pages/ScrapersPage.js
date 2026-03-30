import React, { useState, useEffect } from 'react';
import api from '../api';
import ScraperForm from '../components/ScraperForm';
import ScraperList from '../components/ScraperList';
import { useAuth } from '../hooks/useAuth';

const ScrapersPage = () => {
  const [scrapers, setScrapers] = useState([]);
  const [editingScraper, setEditingScraper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchScrapers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/scrapers/');
      setScrapers(response.data);
    } catch (err) {
      console.error("Error fetching scrapers:", err);
      setError("Failed to fetch scrapers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapers();
  }, []);

  const handleScraperCreated = () => {
    setEditingScraper(null); // Clear editing state after create/update
    fetchScrapers();
  };

  const handleEditScraper = (scraper) => {
    setEditingScraper(scraper);
  };

  const handleDeleteScraper = async (id) => {
    if (window.confirm("Are you sure you want to delete this scraper? This action is irreversible.")) {
      try {
        await api.delete(`/scrapers/${id}`);
        fetchScrapers();
      } catch (err) {
        console.error("Error deleting scraper:", err);
        setError("Failed to delete scraper. You might not have permission or it's in use.");
      }
    }
  };

  const handleRunScraper = async (id) => {
    try {
      const response = await api.post(`/scrapers/${id}/run`);
      alert(`Scraper job ${response.data.id} started successfully! Check Dashboard/Jobs for status.`);
    } catch (err) {
      console.error("Error running scraper:", err);
      setError(err.response?.data?.detail || "Failed to start scraper job. Please try again.");
    }
  };

  if (loading) return <div className="text-center p-4">Loading scrapers...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Scrapers Management</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">{editingScraper ? 'Edit Scraper' : 'Create New Scraper'}</h2>
        <ScraperForm 
          scraper={editingScraper} 
          onScraperSubmitted={handleScraperCreated} 
          onCancelEdit={() => setEditingScraper(null)}
          currentUser={user}
        />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Existing Scrapers</h2>
        <ScraperList 
          scrapers={scrapers} 
          onEdit={handleEditScraper} 
          onDelete={handleDeleteScraper} 
          onRun={handleRunScraper} 
          currentUser={user}
        />
      </div>
    </div>
  );
};

export default ScrapersPage;