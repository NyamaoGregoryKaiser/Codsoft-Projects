// server.js
const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

const products = [
  { id: 1, name: 'Product 1', price: 10 },
  { id: 2, name: 'Product 2', price: 20 },
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// App.js
import React, { useState, useEffect } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div>
      <h1>Products</h1>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name} - ${product.price}</h3>
          <button onClick={() => addToCart(product)}>Add to Cart</button>
        </div>
      ))}
      <h2>Cart</h2>
      <ul>
        {cart.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  );
}

export default App;

// products.test.js (Jest example)
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders product list', () => {
  render(<App />);
  // Assertions to check if products are rendered
});

