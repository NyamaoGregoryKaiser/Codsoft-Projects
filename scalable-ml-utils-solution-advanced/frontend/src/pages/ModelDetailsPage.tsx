import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import { Model, ModelVersion } from '../types/Model';
import { useAuth } from '../context/AuthContext';
import './ModelDetailsPage.css';

const ModelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<Model | null>(null);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchModelDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const modelResponse = await apiClient.get<Model>(`/models/${id}`);
        setModel(modelResponse.data);

        // Fetch versions separately as they might not be eagerly loaded with the model endpoint
        const versionsResponse = await apiClient.get<ModelVersion[]>(`/models/${id}/versions`);
        setVersions(versionsResponse.data.sort((a, b) => b.versionNumber - a.versionNumber));
      } catch (err: any) {
        console.error('Error fetching model details:', err);
        setError('Failed to fetch model details: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchModelDetails();
    }
  }, [id]);

  const handleDeleteVersion = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete version ${versionNumber} of this model?`)) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/models/${id}/versions/${versionNumber}`);
      setVersions(versions.filter(v => v.versionNumber !== versionNumber));
      alert(`Model version ${versionNumber} deleted successfully.`);
    } catch (err: any) {
      console.error('Error deleting version:', err);
      setError('Failed to delete version: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVersion = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to activate version ${versionNumber} of this model?`)) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/models/${id}/versions/${versionNumber}/activate`);
      setVersions(prevVersions =>
        prevVersions.map(v => ({
          ...v,
          isActive: v.versionNumber === versionNumber,
        })).sort((a, b) => b.versionNumber - a.versionNumber)
      );
      alert(`Model version ${versionNumber} activated successfully.`);
    } catch (err: any) {
      console.error('Error activating version:', err);
      setError('Failed to activate version: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading model details...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  if (!model) {
    return <div className="container">Model not found.</div>;
  }

  return (
    <div className="model-details-page container">
      <button onClick={() => navigate('/')} className="back-button">&larr; Back to Models</button>
      <h1>{model.name}</h1>
      <p className="model-description">{model.description}</p>
      <p><strong>Created:</strong> {new Date(model.createdAt).toLocaleString()}</p>
      <p><strong>Last Updated:</strong> {new Date(model.updatedAt).toLocaleString()}</p>

      <h2>Model Versions</h2>
      {versions.length === 0 ? (
        <p>No versions available for this model.</p>
      ) : (
        <div className="versions-grid">
          {versions.map((version) => (
            <div key={version.id} className={`version-card ${version.isActive ? 'active-version' : ''}`}>
              <h3>Version {version.versionNumber} {version.isActive && <span className="active-tag">(Active)</span>}</h3>
              <p>Uploaded: {new Date(version.createdAt).toLocaleString()}</p>
              {version.accuracy && <p>Accuracy: {version.accuracy.toFixed(4)}</p>}
              {version.precision && <p>Precision: {version.precision.toFixed(4)}</p>}
              {version.recall && <p>Recall: {version.recall.toFixed(4)}</p>}
              {version.f1Score && <p>F1 Score: {version.f1Score.toFixed(4)}</p>}
              {isAdmin && (
                <div className="version-actions">
                  {!version.isActive && (
                    <button onClick={() => handleActivateVersion(version.versionNumber)} className="action-button">
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteVersion(version.versionNumber)}
                    className="delete-button"
                    disabled={version.isActive}
                  >
                    Delete
                  </button>
                  {version.isActive && <p className="warning-text">Deactivate before deleting.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelDetailsPage;