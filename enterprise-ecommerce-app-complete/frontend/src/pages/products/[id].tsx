```typescript
import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Product, ProductStatus } from '@/src/types';
import { productApi } from '@/src/api/products';
import { useCart } from '@/src/contexts/CartContext';
import { CurrencyDollarIcon, CubeTransparentIcon, ArchiveBoxIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/src/components/shared/LoadingSpinner';
import ErrorMessage from '@/src/components/shared/ErrorMessage';

interface ProductDetailProps {
  product?: Product;
  error?: string;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, error }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isProductInCart, updateCartItemQuantity, cartItems } = useCart();

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!product) {
    return <LoadingSpinner />;
  }

  const handleAddToCart = () => {
    if (product.stock === 0 || product.status === ProductStatus.OUT_OF_STOCK) {
      toast.error('This product is currently out of stock.');
      return;
    }

    const currentCartItem = cartItems.find(item => item.productId === product.id);
    const currentQuantityInCart = currentCartItem ? currentCartItem.quantity : 0;

    if (currentQuantityInCart + quantity > product.stock) {
      toast.error(`You cannot add more than available stock (${product.stock}) for this product.`);
      return;
    }

    if (isProductInCart(product.id)) {
      updateCartItemQuantity(product.id, currentQuantityInCart + quantity);
    } else {
      addToCart(product, quantity);
    }
    setQuantity(1); // Reset quantity after adding
  };

  const isOutOfStock = product.stock === 0 || product.status === ProductStatus.OUT_OF_STOCK;

  return (
    <>
      <Head>
        <title>{product.name} | E-Shop</title>
        <meta name="description" content={product.description.substring(0, 160)} />
      </Head>

      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 lg:flex lg:space-x-8">
        <div className="lg:w-1/2 flex justify-center items-center relative h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: 'contain' }} // Use contain for product images
              className="p-4"
              priority
            />
          ) : (
            <div className="text-gray-400 text-lg">No Image Available</div>
          )}
        </div>

        <div className="lg:w-1/2 mt-8 lg:mt-0">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{product.category?.name || 'Uncategorized'}</p>

          <p className="text-5xl font-bold text-primary mb-6">${product.price.toFixed(2)}</p>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">{product.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center text-gray-700">
              <CubeTransparentIcon className="h-6 w-6 text-blue-500 mr-2" />
              <span>Stock: <span className="font-semibold">{product.stock} available</span></span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckBadgeIcon className="h-6 w-6 text-green-500 mr-2" />
              <span>Status: <span className="font-semibold">{product.status}</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-8">
            <label htmlFor="quantity" className="text-lg font-medium text-gray-700">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={product.stock > 0 ? product.stock : 1}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-lg"
              disabled={isOutOfStock}
            />
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex items-center justify-center px-6 py-3 rounded-md text-lg font-semibold transition-colors duration-200
                ${isOutOfStock
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-red-600 active:scale-95'}
              `}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          {/* Reviews Section - Simplified for this example */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews ({product.reviews.length})</h3>
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <p className="font-semibold text-gray-800">{review.user?.firstName} {review.user?.lastName}</p>
                      <p className="ml-3 text-sm text-yellow-500">{'⭐'.repeat(review.rating)}</p>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {product.reviews && product.reviews.length === 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h3>
              <p className="text-gray-600">No reviews yet for this product. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ProductDetailProps> = async (context) => {
  const { id } = context.params as { id: string };

  try {
    const product = await productApi.getProductById(id);
    return {
      props: {
        product,
      },
    };
  } catch (err: any) {
    if (err.status === 404) {
      return {
        notFound: true, // Will render 404 page
      };
    }
    console.error('Failed to fetch product:', err);
    return {
      props: {
        error: err.message || 'An unexpected error occurred.',
      },
    };
  }
};

export default ProductDetail;
```