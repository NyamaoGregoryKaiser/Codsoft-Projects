```javascript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function ProductCard({ product, onEdit, onDelete }) {
  const { user } = useAuth();
  const isOwner = user && product.owner && user.id === product.owner.id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">${parseFloat(product.price).toFixed(2)}</p>
      <p>Stock: {product.stock}</p>
      {product.owner && <p>Owner: {product.owner.username}</p>}
      {(isOwner || isAdmin) && (
        <div className="button-group">
          <button onClick={() => onEdit(product.id)}>Edit</button>
          <button className="delete-button" onClick={() => onDelete(product.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
```