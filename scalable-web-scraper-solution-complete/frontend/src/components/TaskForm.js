import React, { useState } from 'react';

function TaskForm({ onTaskCreated, authAxios, setError, setLoading }) {
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [cssSelector, setCssSelector] = useState('');
  const [frequency, setFrequency] = useState(3600); // Default to 1 hour

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const taskData = {
        name,
        target_url: targetUrl,
        css_selector: cssSelector || null,
        frequency_seconds: parseInt(frequency, 10),
      };
      await authAxios.post('/tasks/', taskData);
      setName('');
      setTargetUrl('');
      setCssSelector('');
      setFrequency(3600);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      console.error('Failed to create task:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form">
      <h2>Create New Scraping Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Task Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="targetUrl">Target URL:</label>
          <input
            type="url"
            id="targetUrl"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="cssSelector">CSS Selector (optional, comma-separated for multiple):</label>
          <input
            type="text"
            id="cssSelector"
            value={cssSelector}
            onChange={(e) => setCssSelector(e.target.value)}
            placeholder="e.g., div.item, h1.title"
          />
        </div>
        <div className="form-group">
          <label htmlFor="frequency">Frequency (seconds):</label>
          <input
            type="number"
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            min="60"
            required
          />
        </div>
        <button type="submit" className="btn">Create Task</button>
      </form>
    </div>
  );
}

export default TaskForm;
```