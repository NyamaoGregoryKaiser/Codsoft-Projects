import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="text-center py-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg">
      <h1 className="text-5xl font-extrabold mb-4">Welcome to E-Shop!</h1>
      <p className="text-xl mb-8">Your one-stop shop for all your needs.</p>
      <Link
        to="/products"
        className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300 shadow-md"
      >
        Shop Now
      </Link>
    </div>
  );
}

export default HomePage;