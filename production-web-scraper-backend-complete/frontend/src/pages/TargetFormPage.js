import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

const TargetFormPage = () => {
  const { targetId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!targetId;

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [schedule, setSchedule] = useState(''); // Cron string, e.g., '0 * * * *' for hourly
  const [selectors, setSelectors] = useState({}); // JSON object for CSS selectors
  const [selectorInput, setSelectorInput] = useState(''); // Temp input for new selector key
  const [selectorValueInput, setSelectorValueInput] = useState(''); // Temp input for new selector value
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      apiClient.get(`/targets/${targetId}`)
        .then(response => {
          const target = response.data;
          setName(target.name);
          setUrl(target.url);
          setSchedule(target.schedule || '');
          setSelectors(target.selectors || {});
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to fetch target for editing.');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [targetId, isEditing]);

  const handleAddSelector = () => {
    if (selectorInput && selectorValueInput) {
      setSelectors({ ...selectors, [selectorInput]: selectorValueInput });
      setSelectorInput('');
      setSelectorValueInput('');
    }
  };

  const handleDeleteSelector = (keyToDelete) => {
    const newSelectors = { ...selectors };
    delete newSelectors[keyToDelete];
    setSelectors(newSelectors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const targetData = {
        name,
        url,
        schedule: schedule || null, // Ensure empty string becomes null for DB
        selectors,
      };

      if (isEditing) {
        await apiClient.patch(`/targets/${targetId}`, targetData);
        alert('Target updated successfully!');
      } else {
        await apiClient.post('/targets', targetData);
        alert('Target created successfully!');
      }
      navigate('/targets');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save target.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div className="text-center mt-8">Loading target data...</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? `Edit Target: ${name}` : 'Create New Target'}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="schedule">
            Schedule (Cron String - e.g., '0 * * * *' for hourly, leave empty for manual)
          </label>
          <input
            type="text"
            id="schedule"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="e.g., 0 * * * * (every hour)"
          />
          <p className="text-xs text-gray-500 mt-1">
            <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Cron String Helper
            </a>
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">CSS Selectors for Data Extraction</h3>
          <div className="flex mb-2">
            <input
              type="text"
              className="shadow appearance-none border rounded w-1/3 py-2 px-3 mr-2 text-gray-700"
              placeholder="Data Key (e.g., productTitle)"
              value={selectorInput}
              onChange={(e) => setSelectorInput(e.target.value)}
            />
            <input
              type="text"
              className="shadow appearance-none border rounded w-2/3 py-2 px-3 mr-2 text-gray-700"
              placeholder="CSS Selector (e.g., .product-name)"
              value={selectorValueInput}
              onChange={(e) => setSelectorValueInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddSelector}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded max-h-48 overflow-y-auto">
            {Object.keys(selectors).length === 0 ? (
              <p className="text-gray-500 text-sm">No selectors added yet.</p>
            ) : (
              <ul>
                {Object.entries(selectors).map(([key, value]) => (
                  <li key={key} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <span className="font-semibold">{key}:</span>
                    <span className="flex-grow ml-2 truncate">{value}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSelector(key)}
                      className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded ml-2"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Target' : 'Create Target')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/targets')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TargetFormPage;