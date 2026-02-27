import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description || 'No description available.'}</p>
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-teal-600">${product.price.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;