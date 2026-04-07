```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatasetById, updateDataset as updateDatasetService } from '../services/datasetService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './FormPage.css';

const UpdateDatasetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [schemaPreview, setSchemaPreview] = useState('{}');

  const [loading, setLoading] = useState(true); // Start loading to fetch dataset data
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const datasetData = await getDatasetById(id);
        setName(datasetData.name);
        setDescription(datasetData.description);
        setSourceUrl(datasetData.source_url || '');
        setSchemaPreview(JSON.stringify(datasetData.schema_preview, null, 2));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dataset:', err);
        setError(err.message || 'Failed to load dataset for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(schemaPreview);
    } catch (parseError) {
      setError('Invalid JSON for Schema Preview.');
      setLoading(false);
      return;
    }

    const datasetData = {
      name,
      description,
      source_url: sourceUrl || null,
      schema_preview: parsedSchema,
    };

    try {
      const updatedDataset = await updateDatasetService(id, datasetData);
      setSuccess('Dataset updated successfully!');
      navigate(`/datasets/${updatedDataset.id}`);
    } catch (err) {
      console.error('Failed to update dataset:', err);
      setError(err.message || 'Failed to update dataset.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading dataset data..." />;
  }

  return (
    <div className="form-page-container">
      <h2>Update ML Dataset</h2>
      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="name">Dataset Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="sourceUrl">Source URL (Optional):</label>
          <input
            type="url"
            id="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="schemaPreview">Schema Preview (JSON):</label>
          <textarea
            id="schemaPreview"
            value={schemaPreview}
            onChange={(e) => setSchemaPreview(e.target.value)}
            rows="8"
            placeholder='{"columns": ["feature1", "feature2"], "types": ["numeric", "category"]}'
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Dataset'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/datasets/${id}`)}>Cancel</button>
      </form>
    </div>
  );
};

export default UpdateDatasetPage;
```