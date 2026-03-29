```typescript
import Head from 'next/head';
import React from 'react';
import ProductCard from '@/src/components/product/ProductCard';
import { Product, PaginatedResult } from '@/src/types';
import { productApi } from '@/src/api/products';
import useSWR from 'swr';
import LoadingSpinner from '@/src/components/shared/LoadingSpinner';
import ErrorMessage from '@/src/components/shared/ErrorMessage';

export default function Home() {
  // Use SWR for data fetching, provides caching, revalidation, etc.
  const { data, error, isLoading } = useSWR<PaginatedResult<{ products: Product[] }>>('/products', () =>
    productApi.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }) // Fetch latest 8 products
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load products. Please try again later." />;

  const products = data?.data.products || [];

  return (
    <>
      <Head>
        <title>E-Shop - Home</title>
        <meta name="description" content="Your one-stop shop for all your needs." />
      </Head>

      <section className="text-center py-16 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg mb-8 shadow-inner">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 animate-fade-in-up">
          Welcome to <span className="text-primary">E-Shop</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up delay-200">
          Discover amazing products at unbeatable prices.
        </p>
        <div className="mt-8 animate-fade-in-up delay-400">
          <Link href="/products" className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">Featured Products</h2>
        {products.length === 0 ? (
          <p className="text-center text-gray-600">No featured products available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link href="/products" className="text-primary hover:text-red-600 font-medium text-lg border-b-2 border-primary hover:border-red-600 pb-1">
            View All Products &rarr;
          </Link>
        </div>
      </section>

      {/* Add more sections like "New Arrivals", "Top Categories", "Testimonials" etc. */}
    </>
  );
}
```