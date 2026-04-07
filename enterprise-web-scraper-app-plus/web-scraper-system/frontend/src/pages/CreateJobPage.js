```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cssSelectors, setCssSelectors] = useState([{ name: '', selector: '' }]);
  const [cronSchedule, setCronSchedule] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectorChange = (index, field, value) => {
    const newSelectors = [...cssSelectors];
    newSelectors[index] = { ...newSelectors[index], [field]: value };
    setCssSelectors(newSelectors);
  };

  const addSelector = () => {
    setCssSelectors([...cssSelectors, { name: '', selector: '' }]);
  };

  const removeSelector = (index) => {
    setCssSelectors(cssSelectors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const jobData = {
      name,
      url,
      cssSelectors: cssSelectors.filter(s => s.name && s.selector), // Filter out empty selectors
      cronSchedule: cronSchedule || null, // Send null if empty
      isActive,
    };

    if (jobData.cssSelectors.length === 0) {
      setError('Please add at least one CSS selector.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/jobs', jobData);
      alert('Job created successfully!');
      navigate(`/jobs/${response.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Scraping Job</h1>
      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Job Name
            </label>
            <input
              type="text"
              id="name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
              Target URL
            </label>
            <input
              type="url"
              id="url"
              className="input-field"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">CSS Selectors</h3>
          {cssSelectors.map((selector, index) => (
            <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <input
                type="text"
                placeholder="Name (e.g., productTitle)"
                value={selector.name}
                onChange={(e) => handleSelectorChange(index, 'name', e.target.value)}
                className="input-field flex-1"
                required
              />
              <input
                type="text"
                placeholder="CSS Selector (e.g., .product-title or .product-img@src)"
                value={selector.selector}
                onChange={(e) => handleSelectorChange(index, 'selector', e.target.value)}
                className="input-field flex-2"
                required
              />
              {cssSelectors.length > 1 && (
                <button type="button" onClick={() => removeSelector(index)} className="btn btn-danger sm:w-auto">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSelector} className="btn btn-secondary mt-2">
            Add Selector
          </button>

          <div className="mb-4 mt-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cronSchedule">
              Cron Schedule (optional)
            </label>
            <input
              type="text"
              id="cronSchedule"
              className="input-field"
              value={cronSchedule}
              onChange={(e) => setCronSchedule(e.target.value)}
              placeholder="e.g., 0 * * * * (every hour)"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no schedule. <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Cron syntax help</a></p>
          </div>

          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="mr-2"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label className="text-gray-700 text-sm font-bold" htmlFor="isActive">
              Active Job
            </label>
          </div>

          {error && <p className="text-red-500 text-sm italic mb-4">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateJobPage;
```