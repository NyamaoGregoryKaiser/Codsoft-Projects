import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import productService from '../api/productService';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { user } = useAuth();
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProducts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await productService.getAllProducts();
        // Filter products created by the current user
        const productsOwnedByUser = response.data.data.products.filter(p => p.owner.id === user.id);
        setUserProducts(productsOwnedByUser);
      } catch (err) {
        setError('Failed to load your products.');
        console.error('Error fetching user products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProducts();
  }, [user]);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        setUserProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      } catch (err) {
        setError('Failed to delete product.');
        console.error('Error deleting product:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  if (!user) {
    return <div className="text-center text-xl mt-10">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Welcome, {user.username || user.email}!</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">Manage your products here.</p>

      <div className="flex justify-end mb-6">
        <Link to="/products/new" className="btn btn-primary">Add New Product</Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Products</h2>
        {userProducts.length === 0 ? (
          <p className="text-gray-600">You haven't added any products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Product Name</th>
                  <th className="py-2 px-4 border-b text-left">Price</th>
                  <th className="py-2 px-4 border-b text-left">Stock</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{product.name}</td>
                    <td className="py-2 px-4 border-b">${product.price}</td>
                    <td className="py-2 px-4 border-b">{product.stock}</td>
                    <td className="py-2 px-4 border-b flex space-x-2">
                      <Link to={`/products/${product.id}`} className="btn btn-secondary !px-3 !py-1 text-sm">View</Link>
                      <Link to={`/products/edit/${product.id}`} className="btn btn-primary !px-3 !py-1 text-sm">Edit</Link>
                      <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-danger !px-3 !py-1 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;