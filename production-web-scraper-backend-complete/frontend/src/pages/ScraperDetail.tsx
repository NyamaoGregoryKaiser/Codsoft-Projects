import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';

interface Scraper {
  id: number;
  name: string;
  description: string;
  target_url: string;
  parse_rules: object;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export const ScraperDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [scraper, setScraper] = useState<Partial<Scraper>>({
    name: '',
    description: '',
    target_url: '',
    parse_rules: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const loadScraper = async () => {
        try {
          const response = await api.fetchScraperById(parseInt(id));
          setScraper(response.data);
        } catch (err: any) {
          console.error('Failed to fetch scraper:', err);
          setError(err.response?.data?.detail || 'Failed to load scraper.');
        } finally {
          setLoading(false);
        }
      };
      loadScraper();
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScraper(prev => ({ ...prev, [name]: value }));
  };

  const handleParseRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      setScraper(prev => ({ ...prev, parse_rules: JSON.parse(e.target.value) }));
      setError(null); // Clear previous JSON errors
    } catch (err) {
      setError('Invalid JSON for Parse Rules');
      // Keep invalid text in textarea, but don't update state until valid
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic validation
    if (!scraper.name || !scraper.target_url || Object.keys(scraper.parse_rules || {}).length === 0) {
        setError("Name, Target URL, and Parse Rules are required.");
        setIsSubmitting(false);
        return;
    }
    if (!scraper.parse_rules || !('data_fields' in (scraper.parse_rules as any))) {
        setError("Parse rules must contain a 'data_fields' dictionary.");
        setIsSubmitting(false);
        return;
    }


    try {
      if (isNew) {
        await api.createScraper(scraper);
      } else if (scraper.id) {
        await api.updateScraper(scraper.id, scraper);
      }
      navigate('/scrapers');
    } catch (err: any) {
      console.error('Failed to save scraper:', err);
      setError(err.response?.data?.detail || 'Failed to save scraper.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerJob = async () => {
    if (scraper.id) {
      if (window.confirm(`Are you sure you want to trigger a scraping job for "${scraper.name}"?`)) {
        try {
          const response = await api.triggerScrapingJob(scraper.id);
          alert(`Scraping job ${response.data.id} triggered successfully! Status: ${response.data.status}`);
          navigate('/jobs'); // Optionally redirect to jobs page
        } catch (err: any) {
          console.error('Failed to trigger job:', err);
          alert(err.response?.data?.detail || 'Failed to trigger scraping job.');
        }
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading scraper details...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{isNew ? 'Create New Scraper' : `Edit Scraper: ${scraper.name}`}</h1>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <form onSubmit={handleSave}>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={scraper.name || ''}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="target_url" className="block text-gray-700 text-sm font-bold mb-2">Target URL:</label>
            <input
              type="url"
              id="target_url"
              name="target_url"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={scraper.target_url || ''}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={scraper.description || ''}
              onChange={handleChange}
              disabled={isSubmitting}
            ></textarea>
          </div>
          <div className="mb-6">
            <label htmlFor="parse_rules" className="block text-gray-700 text-sm font-bold mb-2">Parse Rules (JSON):</label>
            <textarea
              id="parse_rules"
              name="parse_rules"
              rows={8}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${error && error.includes('JSON') ? 'border-red-500' : ''}`}
              value={JSON.stringify(scraper.parse_rules, null, 2)}
              onChange={handleParseRulesChange}
              required
              disabled={isSubmitting}
              placeholder={`{\n  "item_selector": "div.product",\n  "data_fields": {\n    "title": "h2.title::text",\n    "price": "span.price::text",\n    "link": "a.product-link::href"\n  }\n}`}
            ></textarea>
            {error && error.includes('JSON') && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
             <p className="text-gray-500 text-xs italic mt-1">
                Define CSS selectors for `item_selector` (optional, for multiple items) and `data_fields` (required).
                Use `::text` for text content or `::attr_name` for attribute values.
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 mr-2"
                disabled={isSubmitting || !!error}
              >
                {isSubmitting ? 'Saving...' : 'Save Scraper'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/scrapers')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
            {!isNew && (
              <button
                type="button"
                onClick={handleTriggerJob}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200"
                disabled={isSubmitting}
              >
                Trigger New Job
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
```
---