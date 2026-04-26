```javascript
import React from 'react';

const ItemCard = ({ item, onUpdate, onDelete }) => {
  return (
    <div className="item-card">
      <h3>{item.title}</h3>
      <p>{item.description || 'No description'}</p>
      <p>Status: {item.is_completed ? 'Completed' : 'Pending'}</p>
      <div className="item-actions">
        <button className="btn btn-secondary" onClick={() => onUpdate(item.id, { is_completed: !item.is_completed })}>
          Mark as {item.is_completed ? 'Pending' : 'Completed'}
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(item.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
```