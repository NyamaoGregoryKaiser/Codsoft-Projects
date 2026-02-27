import React, { useState, useEffect } from 'react';
import * as productApi from '../api/products';
import { Product } from '../types';
import ProductCard from '../components/Products/ProductCard';
import Input from '../components/Common/Input';
import Button from '../components/Common/Button';
import { Link } from 'react-router-dom';

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {
                page: 1, // For simplicity, always fetch page 1
                limit: 100, // Fetch more for demo
            };
            if (searchTerm) params.name = searchTerm;
            if (minPrice !== '') params.minPrice = minPrice;
            if (maxPrice !== '') params.maxPrice = maxPrice;

            const response = await productApi.getProducts(params);
            setProducts(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch products.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []); // Initial fetch

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    if (loading) return <div className="text-center p-8">Loading products...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 text-center">Our Products</h1>

            <form onSubmit={handleSearch} className="mb-8 p-6 bg-white rounded-lg shadow-lg flex flex-wrap gap-4 items-end justify-center">
                <Input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    label="Product Name"
                    className="w-full md:w-auto"
                />
                <Input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    label="Min Price"
                    className="w-full md:w-auto"
                />
                <Input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    label="Max Price"
                    className="w-full md:w-auto"
                />
                <Button type="submit" variant="primary" className="w-full md:w-auto px-6 py-2.5">Apply Filters</Button>
            </form>

            {products.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">No products found matching your criteria.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link to={`/products/${product.id}`} key={product.id}>
                            <ProductCard product={product} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;