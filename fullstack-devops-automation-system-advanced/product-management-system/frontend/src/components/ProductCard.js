import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // For product card styles

function ProductCard({ product, onDelete }) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">${parseFloat(product.price).toFixed(2)}</p>
      <p className="stock">Stock: {product.stock}</p>
      <div className="product-card-actions">
        <Link to={`/products/edit/${product.id}`} className="btn edit-btn">Edit</Link>
        <button onClick={() => onDelete(product.id)} className="btn delete-btn">Delete</button>
      </div>
    </div>
  );
}

export default ProductCard;
```

```