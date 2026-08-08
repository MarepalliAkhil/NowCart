import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryBar } from '../components/CategoryBar';
import { ProductCarousel } from '../components/ProductCarousel';
import { BrandGrid } from '../components/BrandGrid';
import { ProductModal } from '../components/ProductModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useNowCartStore } from '../store/useNowCartStore';
import { getCartCrossSellRecommendations } from '../utils/recommendations';
import { Product } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const products = useNowCartStore((state) => state.products);
  const cart = useNowCartStore((state) => state.cart);
  const recentlyViewed = useNowCartStore((state) => state.recentlyViewed);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const trendingProducts = [...products].reverse();
  const flashSaleProducts = products.slice(0, 5);
  const newArrivals = products.slice(5, 12);
  const bestSellers = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Compute live recency-weighted cart cross-sell recommendations
  const cartCrossSellItems = getCartCrossSellRecommendations(cart, products, 8);
  const cartCrossSellProducts = cartCrossSellItems.map((rec) => ({
    ...rec.product,
    reason: rec.reason,
    ai_badge: {
      type: 'outfit' as const,
      label: rec.reason,
    },
  }));

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <HeroBanner onShopNow={() => navigate('/category/Women')} />

      <CategoryBar
        selectedCategory="All"
        onSelectCategory={(cat) => navigate(`/category/${encodeURIComponent(cat)}`)}
      />

      <ProductCarousel
        title="Picked for your style"
        subtitle="Updating as you browse — the more you explore, the more personal this gets"
        badge="LIVE PICKS"
        products={products.slice(0, 8)}
        onOpenModal={(p) => setSelectedProductModal(p)}
      />

      {cart.length > 0 && cartCrossSellProducts.length > 0 && (
        <ProductCarousel
          title="Goes Well With Your Cart"
          subtitle={`Style pairing recommendations based on your active shopping bag`}
          badge="STYLED FOR YOU"
          products={cartCrossSellProducts}
          onOpenModal={(p) => setSelectedProductModal(p)}
        />
      )}

      <ProductCarousel
        title="Trending right now"
        subtitle="The most loved articles across active fashion shoppers today"
        badge="MOST LOVED"
        products={trendingProducts.slice(0, 8)}
        onOpenModal={(p) => setSelectedProductModal(p)}
      />

      <ProductCarousel
        title="People with similar taste also liked"
        subtitle="Styles that shoppers with your taste have loved most"
        badge="TOP RATED"
        products={bestSellers.slice(0, 8)}
        onOpenModal={(p) => setSelectedProductModal(p)}
      />

      <ProductCarousel
        title="Flash Sale — Up to 40% Off"
        subtitle="Special pricing on premium wardrobe staples"
        badge="LIMITED GEMS"
        products={flashSaleProducts}
        onOpenModal={(p) => setSelectedProductModal(p)}
      />

      <BrandGrid onSelectBrand={(brandName) => navigate(`/search?q=${encodeURIComponent(brandName)}`)} />

      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh additions to our catalog for the current season"
        badge="NEW SEASON"
        products={newArrivals}
        onOpenModal={(p) => setSelectedProductModal(p)}
      />

      {recentlyViewed.length > 0 && (
        <ProductCarousel
          title="Picked up right where you left off"
          subtitle="Items you recently inspected in your active session"
          badge="YOUR HISTORY"
          products={recentlyViewed}
          onOpenModal={(p) => setSelectedProductModal(p)}
        />
      )}

      <ProductModal
        product={selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
      />
    </motion.div>
  );
};
