```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { deleteApplication, regenerateApiKey } from '../api';
import './AppCard.css';

const AppCard = ({ application, onDeleteSuccess, onApiKeyRegenerate }) => {
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${application.name}"? This action cannot be undone.`)) {
      try {
        await deleteApplication(application.id);
        toast.success(`Application "${application.name}" deleted successfully.`);
        onDeleteSuccess(application.id);
      } catch (error) {
        console.error('Error deleting application:', error);
        toast.error(`Failed to delete application: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleRegenerateApiKey = async () => {
    if (window.confirm(`Are you sure you want to regenerate the API Key for "${application.name}"? The old key will stop working immediately.`)) {
      try {
        const response = await regenerateApiKey(application.id);
        toast.success(`API Key regenerated for "${application.name}".`);
        onApiKeyRegenerate(application.id, response.data.data.apiKey);
      } catch (error) {
        console.error('Error regenerating API Key:', error);
        toast.error(`Failed to regenerate API Key: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div className="app-card">
      <Link to={`/app/${application.id}`} className="app-card-link-wrapper">
        <h3 className="app-card-name">{application.name}</h3>
        <p className="app-card-description">{application.description || 'No description provided.'}</p>
        <div className="app-card-info">
          <span>Created: {new Date(application.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="app-card-api-key">
          <strong>API Key:</strong> <span className="api-key-value">{application.apiKey}</span>
        </div>
      </Link>
      <div className="app-card-actions">
        <button onClick={handleRegenerateApiKey} className="action-button regenerate-button">
          Regenerate Key
        </button>
        <button onClick={handleDelete} className="action-button delete-button">
          Delete
        </button>
      </div>
    </div>
  );
};

export default AppCard;
```