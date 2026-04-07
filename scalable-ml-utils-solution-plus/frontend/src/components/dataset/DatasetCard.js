```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import './DatasetCard.css';

const DatasetCard = ({ dataset }) => {
  return (
    <div className="dataset-card">
      <Link to={`/datasets/${dataset.id}`} className="dataset-card-link">
        <h3>{dataset.name}</h3>
        <p>{dataset.description || 'No description provided.'}</p>
        <p><strong>Source:</strong> {dataset.source_url ? <a href={dataset.source_url} target="_blank" rel="noopener noreferrer">{dataset.source_url}</a> : 'N/A'}</p>
        <p className="owner-info">Owner: {dataset.owner?.username || 'N/A'}</p>
      </Link>
    </div>
  );
};

export default DatasetCard;
```