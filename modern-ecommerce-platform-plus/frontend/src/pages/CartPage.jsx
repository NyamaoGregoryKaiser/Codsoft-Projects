import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

function CartPage() {
  const { cartItems, updateItemQuantity, removeItemFromCart, clearCart, cartTotal } = useCart();

  const handleUpdateQuantity = (productId, newQuantity) => {
    updateItemQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeItemFromCart(productId);
  };

  const handleCheckout = () => {
    alert('Proceeding to checkout! (This is a mock checkout)');
    clearCart();
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
        <p className="text-lg text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="bg-blue-600 text-white py-3 px-6 rounded-md text-lg hover:bg-blue-700 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Your Shopping Cart</h1>

      <div className="border-t border-b border-gray-200 py-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center flex-grow">
              <img
                src={item.imageUrl || 'https://via.placeholder.com/80?text=No+Image'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-md mr-4"
              />
              <div>
                <Link to={`/products/${item.id}`} className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                  {item.name}
                </Link>
                <p className="text-gray-600 text-sm">Category: {item.category_name || 'Uncategorized'}</p>
                <p className="text-blue-700 font-bold mt-1">${item.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max={item.stock}
                value={item.quantity}
                onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                className="w-16 p-2 border border-gray-300 rounded-md text-center"
              />
              <span className="text-lg font-semibold text-gray-900 w-20 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700 text-xl"
                title="Remove Item"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center mb-6">
        <span className="text-2xl font-bold text-gray-900 mr-4">Total:</span>
        <span className="text-3xl font-extrabold text-blue-700">${cartTotal.toFixed(2)}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          onClick={clearCart}
          className="bg-gray-200 text-gray-800 py-3 px-6 rounded-md text-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Clear Cart
        </button>
        <button
          onClick={handleCheckout}
          className="bg-green-600 text-white py-3 px-6 rounded-md text-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default CartPage;