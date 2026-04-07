```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModelById, updateModel as updateModelService } from '../services/modelService';
import { getDatasets } from '../services/datasetService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './FormPage.css';

const UpdateModelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [datasets, setDatasets] = useState([]);

  const [loading, setLoading] = useState(true); // Start loading to fetch model data
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState(null);

  useEffect(() => {
    const fetchModelAndDatasets = async () => {
      try {
        const modelData = await getModelById(id);
        setName(modelData.name);
        setVersion(modelData.version);
        setDescription(modelData.description);
        setType(modelData.type);
        setEndpointUrl(modelData.endpoint_url);
        setDatasetId(modelData.dataset_id || ''); // Set to empty string if null

        const datasetsData = await getDatasets();
        setDatasets(datasetsData);
        setDatasetsError(null);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch model or datasets:', err);
        setError(err.message || 'Failed to load model or datasets for editing.');
      } finally {
        setLoading(false);
        setDatasetsLoading(false);
      }
    };
    fetchModelAndDatasets();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const modelData = {
      name,
      version,
      description,
      type,
      endpoint_url: endpointUrl,
      dataset_id: datasetId || null,
    };

    try {
      const updatedModel = await updateModelService(id, modelData);
      setSuccess('Model updated successfully!');
      navigate(`/models/${updatedModel.id}`);
    } catch (err) {
      console.error('Failed to update model:', err);
      setError(err.message || 'Failed to update model.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || datasetsLoading) {
    return <Loader message="Loading model data..." />;
  }

  return (
    <div className="form-page-container">
      <h2>Update ML Model</h2>
      {(error || datasetsError) && <Alert message={error || datasetsError} type="error" onClose={() => setError(null)} />}
      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="name">Model Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="version">Version:</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
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
          <label htmlFor="type">Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
            <option value="clustering">Clustering</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="endpointUrl">Endpoint URL:</label>
          <input
            type="url"
            id="endpointUrl"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="datasetId">Associated Dataset:</label>
          <select id="datasetId" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
            <option value="">-- Select a Dataset (Optional) --</option>
            {datasets.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
          {datasetsError && <p className="text-danger">{datasetsError}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Model'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/models/${id}`)}>Cancel</button>
      </form>
    </div>
  );
};

export default UpdateModelPage;
```