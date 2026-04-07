```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './ModelCard.css';

const ModelCard = ({ model }) => {
  return (
    <div className="model-card">
      <Link to={`/models/${model.id}`} className="model-card-link">
        <h3>{model.name} (v{model.version})</h3>
        <p><strong>Type:</strong> {model.type}</p>
        <p>{model.description || 'No description provided.'}</p>
        <p className="owner-info">Owner: {model.owner?.username || 'N/A'}</p>
      </Link>
    </div>
  );
};

export default ModelCard;
```