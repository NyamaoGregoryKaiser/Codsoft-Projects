import React, { useEffect, useState } from 'react';
import { Model, ModelVersion, PredictionRequest, PredictionResponse } from '../types/Model';
import apiClient from '../api/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [uploadModelId, setUploadModelId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMetrics, setUploadMetrics] = useState({ accuracy: '', precision: '', recall: '', f1Score: '' });
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [activeVersionNumber, setActiveVersionNumber] = useState<string>('');
  const [predictionModelId, setPredictionModelId] = useState<string>('');
  const [predictionInput, setPredictionInput] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');

  useEffect(() => {
    fetchModels();
  }, [isAuthenticated]);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Model[]>('/models');
      setModels(response.data);
      if (response.data.length > 0) {
        setUploadModelId(response.data[0].id);
        setActiveModelId(response.data[0].id);
        setPredictionModelId(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) {
      setError('Model name cannot be empty.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/models', { name: newModelName, description: newModelDescription });
      setNewModelName('');
      setNewModelDescription('');
      await fetchModels();
    } catch (err: any) {
      console.error('Error creating model:', err);
      setError('Failed to create model: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this model and all its versions?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/models/${id}`);
      await fetchModels();
    } catch (err: any) {
      console.error('Error deleting model:', err);
      setError('Failed to delete model: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadModelId) {
      setError('Please select a file and a model.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadMetrics.accuracy) formData.append('accuracy', uploadMetrics.accuracy);
    if (uploadMetrics.precision) formData.append('precision', uploadMetrics.precision);
    if (uploadMetrics.recall) formData.append('recall', uploadMetrics.recall);
    if (uploadMetrics.f1Score) formData.append('f1Score', uploadMetrics.f1Score);

    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/models/${uploadModelId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedFile(null);
      setUploadMetrics({ accuracy: '', precision: '', recall: '', f1Score: '' });
      await fetchModels(); // Refresh models to show new version
      alert('Model version uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading version:', err);
      setError('Failed to upload version: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModelId || !activeVersionNumber) {
      setError('Please select a model and a version number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/models/${activeModelId}/versions/${activeVersionNumber}/activate`);
      await fetchModels();
      alert(`Model ${activeModelId} version ${activeVersionNumber} activated.`);
    } catch (err: any) {
      console.error('Error activating version:', err);
      setError('Failed to activate version: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictionModelId || !predictionInput.trim()) {
      setError('Please select a model and provide input data.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const inputData = JSON.parse(predictionInput);
      const requestBody: PredictionRequest = {
        modelId: predictionModelId,
        inputData: inputData,
      };
      const response = await apiClient.post<PredictionResponse>('/predictions', requestBody);
      setPredictionResult(response.data);
    } catch (err: any) {
      console.error('Error making prediction:', err);
      setError('Prediction failed: ' + (err.response?.data?.message || err.message));
      setPredictionResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page container">
      <h1>ML Models Dashboard</h1>

      {loading && <p className="loading-message">Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {isAdmin && (
        <section className="admin-actions">
          <h2>Admin Actions</h2>
          <div className="action-grid">
            <form onSubmit={handleCreateModel} className="action-card">
              <h3>Create New Model</h3>
              <input
                type="text"
                placeholder="Model Name"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                required
              />
              <textarea
                placeholder="Model Description"
                value={newModelDescription}
                onChange={(e) => setNewModelDescription(e.target.value)}
              ></textarea>
              <button type="submit">Create Model</button>
            </form>

            <form onSubmit={handleUploadVersion} className="action-card">
              <h3>Upload Model Version</h3>
              <select value={uploadModelId} onChange={(e) => setUploadModelId(e.target.value)} required>
                <option value="">Select Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <input type="file" onChange={handleFileChange} required />
              <input
                type="number"
                step="0.01"
                placeholder="Accuracy (optional)"
                value={uploadMetrics.accuracy}
                onChange={(e) => setUploadMetrics({ ...uploadMetrics, accuracy: e.target.value })}
              />
              <button type="submit">Upload Version</button>
            </form>

            <form onSubmit={handleActivateVersion} className="action-card">
              <h3>Activate Model Version</h3>
              <select value={activeModelId} onChange={(e) => setActiveModelId(e.target.value)} required>
                <option value="">Select Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Version Number"
                value={activeVersionNumber}
                onChange={(e) => setActiveVersionNumber(e.target.value)}
                required
              />
              <button type="submit">Activate Version</button>
            </form>
          </div>
        </section>
      )}

      <section className="model-list">
        <h2>Available Models</h2>
        {models.length === 0 && !loading && <p>No models available. {isAdmin && "Create one above!"}</p>}
        <div className="models-grid">
          {models.map((model) => (
            <div key={model.id} className="model-card">
              <h3>
                <Link to={`/models/${model.id}`}>{model.name}</Link>
              </h3>
              <p>{model.description}</p>
              <p>Created: {new Date(model.createdAt).toLocaleDateString()}</p>
              {isAdmin && (
                <button onClick={() => handleDeleteModel(model.id)} className="delete-button">
                  Delete Model
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="prediction-section">
        <h2>Make a Prediction</h2>
        <form onSubmit={handlePrediction} className="prediction-form">
          <select value={predictionModelId} onChange={(e) => setPredictionModelId(e.target.value)} required>
            <option value="">Select Model</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder='Enter JSON input data, e.g., {"feature_1": 10, "feature_2": 5}'
            value={predictionInput}
            onChange={(e) => setPredictionInput(e.target.value)}
            rows={5}
            required
          ></textarea>
          <button type="submit">Get Prediction</button>
        </form>
        {predictionResult && (
          <div className="prediction-result">
            <h3>Prediction Result:</h3>
            <p>Model ID: {predictionResult.modelId}</p>
            <p>Version: {predictionResult.versionNumber}</p>
            <pre>{JSON.stringify(predictionResult.predictionResult, null, 2)}</pre>
            <p className="message">{predictionResult.message}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;