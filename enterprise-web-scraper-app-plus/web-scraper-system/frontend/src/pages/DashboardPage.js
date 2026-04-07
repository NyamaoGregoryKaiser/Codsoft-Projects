```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const DashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiClient.get('/jobs');
        setJobs(response.data.data);
      } catch (err) {
        setError('Failed to fetch jobs: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? All results will also be deleted.')) {
      return;
    }
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete job: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRunJob = async (jobId, jobName) => {
    if (!window.confirm(`Are you sure you want to manually run job "${jobName}" now?`)) {
      return;
    }
    try {
      await apiClient.post(`/jobs/${jobId}/run`);
      alert(`Job "${jobName}" triggered successfully!`);
      // Optionally re-fetch jobs to update lastRunAt, or just optimistically update
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, lastRunAt: new Date().toISOString(), status: 'RUNNING' } : job
      ));
    } catch (err) {
      setError('Failed to trigger job: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="text-center mt-8">Loading jobs...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Scraping Jobs</h1>
        <Link to="/jobs/new" className="btn btn-primary">Create New Job</Link>
      </div>
      {jobs.length === 0 ? (
        <p className="text-center text-gray-600">No scraping jobs found. Start by creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <h2 className="text-xl font-semibold mb-2">{job.name}</h2>
              <p className="text-gray-600 mb-1">URL: <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{job.url}</a></p>
              <p className="text-gray-600 mb-1">Schedule: {job.cronSchedule || 'N/A'}</p>
              <p className="text-gray-600 mb-1">Status: <span className={`font-medium ${job.isActive ? 'text-green-600' : 'text-red-600'}`}>{job.isActive ? 'Active' : 'Inactive'}</span> / <span className="font-medium">{job.status}</span></p>
              <p className="text-gray-600 mb-4">Last Run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}</p>
              <div className="flex flex-wrap gap-2">
                <Link to={`/jobs/${job.id}`} className="btn btn-secondary">View Details</Link>
                <button onClick={() => handleRunJob(job.id, job.name)} className="btn btn-primary">Run Now</button>
                <button onClick={() => handleDeleteJob(job.id)} className="btn btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
```