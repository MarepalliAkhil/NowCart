import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage: React.FC = () => {
  const products = useNowCartStore((state) => state.products);
  const wishlistIds = useNowCartStore((state) => state.wishlistIds);

  const wishlistedProducts = products.filter((p) => wishlistIds.has(p.product_id));

  return (
    <div className="space-y-8 py-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink font-sans flex items-center gap-3">
            <Heart className="w-8 h-8 text-error fill-current" />
            Your Favorites & Wishlist
          </h1>
          <p className="text-xs text-muted font-medium mt-1">
            {wishlistedProducts.length} saved articles
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
          style={{ color: '#6E2A3A' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: '#6E2A3A' }} /> Continue Browsing
        </Link>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-24 bg-white border border-subtle rounded-3xl p-12 space-y-4 shadow-sm">
          <Heart className="w-16 h-16 text-muted mx-auto stroke-1" style={{ color: '#6B665F' }} />
          <h2 className="text-xl font-bold text-ink" style={{ color: '#1C1B19' }}>Your wishlist is empty</h2>
          <p className="text-xs text-muted max-w-sm mx-auto" style={{ color: '#6B665F' }}>
            Click the heart icon on any product card to save your favorite styles here!
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-all font-extrabold text-xs uppercase tracking-wider cursor-pointer"
            style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
          >
            Discover Fashion Styles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};
