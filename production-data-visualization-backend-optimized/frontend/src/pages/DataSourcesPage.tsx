```typescript
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { DataSource } from '../types/DataSource';
import './DataSourcesPage.css';

const DataSourcesPage: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [newDataSourceName, setNewDataSourceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/data-sources');
      setDataSources(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data sources.');
      console.error('Fetch data sources error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');
    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      setUploadError('Please select a file to upload.');
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', newDataSourceName || file.name);

    setUploading(true);
    try {
      await api.post('/data-sources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess('File uploaded successfully!');
      setNewDataSourceName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
      fetchDataSources(); // Refresh list
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'File upload failed.');
      console.error('File upload error:', err.response?.data);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataSource = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete data source "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/data-sources/${id}`);
        fetchDataSources(); // Refresh list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete data source.');
        console.error('Delete data source error:', err.response?.data);
      }
    }
  };

  if (loading) {
    return <div className="data-sources-page">Loading data sources...</div>;
  }

  return (
    <div className="data-sources-page">
      <h1>Your Data Sources</h1>
      {error && <p className="error-message">{error}</p>}

      <div className="upload-section">
        <h3>Upload New Data Source (CSV)</h3>
        <form onSubmit={handleFileUpload} className="upload-form">
          <input
            type="text"
            placeholder="Name (Optional, defaults to file name)"
            value={newDataSourceName}
            onChange={(e) => setNewDataSourceName(e.target.value)}
          />
          <input type="file" ref={fileInputRef} accept=".csv" required />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
        {uploadError && <p className="error-message">{uploadError}</p>}
        {uploadSuccess && <p className="success-message">{uploadSuccess}</p>}
      </div>

      <div className="data-sources-list">
        {dataSources.length === 0 ? (
          <p>No data sources uploaded yet. Upload a CSV file to get started.</p>
        ) : (
          dataSources.map((ds) => (
            <div key={ds.id} className="data-source-card">
              <h3>{ds.name} ({ds.file_type.toUpperCase()})</h3>
              <p>Columns: {ds.column_headers.join(', ')}</p>
              <p>Uploaded: {new Date(ds.created_at).toLocaleDateString()}</p>
              <button
                onClick={() => handleDeleteDataSource(ds.id, ds.name)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DataSourcesPage;
```