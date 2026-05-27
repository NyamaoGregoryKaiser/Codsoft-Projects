import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css'; // For general card styling

const ModelCard = ({ model, onDelete, onEdit }) => {
  const createdAt = new Date(model.createdAt * 1000).toLocaleDateString();

  return (
    <div className="model-card">
      <h3 className="model-card-title">{model.name} (v{model.version})</h3>
      <p className="model-card-type">Type: {model.type}</p>
      <p className="model-card-description">{model.description || 'No description provided.'}</p>
      <div className="model-card-meta">
        <span>Owner ID: {model.ownerId}</span>
        <span>Registered: {createdAt}</span>
      </div>
      <div className="model-card-actions">
        <Link to={`/models/${model.id}/inference`} className="button button-primary">
          Infer
        </Link>
        <button onClick={() => onEdit(model.id)} className="button button-secondary">
          Edit
        </button>
        <button onClick={() => onDelete(model.id)} className="button button-danger">
          Delete
        </button>
      </div>
    </div>
  );
};

export default ModelCard;
```