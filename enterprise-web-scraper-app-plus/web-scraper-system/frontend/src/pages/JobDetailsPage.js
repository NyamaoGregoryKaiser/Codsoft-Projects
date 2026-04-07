```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', url: '', cssSelectors: [], cronSchedule: '', isActive: true });

  useEffect(() => {
    const fetchJobAndResults = async () => {
      try {
        const jobResponse = await apiClient.get(`/jobs/${id}`);
        setJob(jobResponse.data.data);
        setEditForm({
          name: jobResponse.data.data.name,
          url: jobResponse.data.data.url,
          cssSelectors: jobResponse.data.data.cssSelectors,
          cronSchedule: jobResponse.data.data.cronSchedule || '',
          isActive: jobResponse.data.data.isActive,
        });

        const resultsResponse = await apiClient.get(`/jobs/${id}/results`);
        setResults(resultsResponse.data.data);
      } catch (err) {
        setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchJobAndResults();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectorChange = (index, field, value) => {
    const newSelectors = [...editForm.cssSelectors];
    newSelectors[index] = { ...newSelectors[index], [field]: value };
    setEditForm(prev => ({ ...prev, cssSelectors: newSelectors }));
  };

  const addSelector = () => {
    setEditForm(prev => ({
      ...prev,
      cssSelectors: [...prev.cssSelectors, { name: '', selector: '' }],
    }));
  };

  const removeSelector = (index) => {
    setEditForm(prev => ({
      ...prev,
      cssSelectors: prev.cssSelectors.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await apiClient.put(`/jobs/${id}`, editForm);
      setJob(response.data.data);
      setIsEditing(false);
      alert('Job updated successfully!');
    } catch (err) {
      setError('Failed to update job: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRunJob = async (jobName) => {
    if (!window.confirm(`Are you sure you want to manually run job "${jobName}" now?`)) {
      return;
    }
    try {
      await apiClient.post(`/jobs/${id}/run`);
      alert(`Job "${jobName}" triggered successfully!`);
      // Re-fetch results to show new run
      const resultsResponse = await apiClient.get(`/jobs/${id}/results`);
      setResults(resultsResponse.data.data);
      // Update job state to reflect lastRunAt and status
      setJob(prevJob => ({ ...prevJob, lastRunAt: new Date().toISOString(), status: 'RUNNING' }));
    } catch (err) {
      setError('Failed to trigger job: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="text-center mt-8">Loading job details...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!job) return <div className="text-center mt-8">Job not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{job.name}</h1>
        <div>
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary mr-2">
            {isEditing ? 'Cancel Edit' : 'Edit Job'}
          </button>
          <button onClick={() => handleRunJob(job.name)} className="btn btn-primary">Run Now</button>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Job Configuration</h2>
        {isEditing ? (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
              <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="input-field" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">URL:</label>
              <input type="text" name="url" value={editForm.url} onChange={handleEditChange} className="input-field" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Cron Schedule:</label>
              <input type="text" name="cronSchedule" value={editForm.cronSchedule} onChange={handleEditChange} className="input-field" placeholder="e.g., 0 * * * *" />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no schedule. <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Cron syntax help</a></p>
            </div>
            <div className="mb-4 flex items-center">
              <input type="checkbox" name="isActive" checked={editForm.isActive} onChange={handleEditChange} className="mr-2" />
              <label className="text-gray-700 text-sm font-bold">Active</label>
            </div>
            <h3 className="text-xl font-semibold mt-6 mb-3">CSS Selectors</h3>
            {editForm.cssSelectors.map((selector, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={selector.name}
                  onChange={(e) => handleSelectorChange(index, 'name', e.target.value)}
                  className="input-field flex-1"
                />
                <input
                  type="text"
                  placeholder="CSS Selector (e.g., .product-title or .product-img@src)"
                  value={selector.selector}
                  onChange={(e) => handleSelectorChange(index, 'selector', e.target.value)}
                  className="input-field flex-2"
                />
                <button onClick={() => removeSelector(index)} className="btn btn-danger">Remove</button>
              </div>
            ))}
            <button onClick={addSelector} className="btn btn-secondary mt-2">Add Selector</button>
            <div className="mt-6">
              <button onClick={handleSaveEdit} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2"><strong className="font-semibold">URL:</strong> <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{job.url}</a></p>
            <p className="mb-2"><strong className="font-semibold">Schedule:</strong> {job.cronSchedule || 'Not Scheduled'}</p>
            <p className="mb-2"><strong className="font-semibold">Active:</strong> <span className={`font-medium ${job.isActive ? 'text-green-600' : 'text-red-600'}`}>{job.isActive ? 'Yes' : 'No'}</span></p>
            <p className="mb-2"><strong className="font-semibold">Current Status:</strong> <span className="font-medium">{job.status}</span></p>
            <p className="mb-2"><strong className="font-semibold">Last Run:</strong> {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}</p>
            <p className="mb-2"><strong className="font-semibold">Next Run:</strong> {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : 'N/A'}</p>
            <h3 className="text-xl font-semibold mt-6 mb-3">CSS Selectors</h3>
            {job.cssSelectors && job.cssSelectors.length > 0 ? (
              <ul className="list-disc list-inside">
                {job.cssSelectors.map((sel, index) => (
                  <li key={index}>{sel.name}: `{sel.selector}`</li>
                ))}
              </ul>
            ) : (
              <p>No selectors defined.</p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Scraping Results</h2>
        {results.length === 0 ? (
          <p className="text-center text-gray-600">No results found for this job yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Timestamp</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Data/Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{new Date(result.timestamp).toLocaleString()}</td>
                    <td className={`py-2 px-4 border-b font-medium ${result.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {result.status === 'FAILED' ? (
                        <p className="text-red-500">{result.error}</p>
                      ) : (
                        <pre className="text-xs bg-gray-100 p-2 rounded max-h-24 overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailsPage;
```