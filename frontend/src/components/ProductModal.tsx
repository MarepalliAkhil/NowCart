import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Star } from 'lucide-react';
import { Product } from '../types';
import { useNowCartStore } from '../store/useNowCartStore';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  userId?: string;
  onAddToCart?: (p: Product, size?: string, color?: string, qty?: number) => void;
  onToggleWishlist?: (p: Product) => void;
  isWishlisted?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
}) => {
  const storeAddToCart = useNowCartStore((state) => state.addToCart);
  const storeToggleWishlist = useNowCartStore((state) => state.toggleWishlist);
  const storeIsWishlisted = useNowCartStore((state) => (product ? state.isWishlisted(product.product_id) : false));

  if (!product) return null;

  const handleAddToCart = () => {
    storeAddToCart(product, 'M', 'Black', 1);
    onClose();
  };

  const handleToggleWishlist = () => {
    storeToggleWishlist(product);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-4xl bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative">
              <img
                src={product.image_url}
                alt={product.prod_name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur text-blue-700 text-[10px] font-mono font-bold rounded-full border border-blue-200">
                {product.confidence_score}% Match
              </span>
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
                  {product.brand || 'NowCart'}
                </span>
                <h2 className="text-2xl font-black text-gray-900 font-sans">{product.prod_name}</h2>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{product.rating || 4.8}</span>
                  </div>
                  <span className="text-gray-300">&bull;</span>
                  <span className="text-xs text-gray-500 font-medium">{product.reviews_count || 120} reviews</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl flex items-baseline gap-3">
                  <span className="text-2xl font-black text-gray-900 font-mono">${product.price?.toFixed(2)}</span>
                  {product.original_price && (
                    <span className="text-xs text-gray-400 line-through font-mono">${product.original_price.toFixed(2)}</span>
                  )}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      storeIsWishlisted ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${storeIsWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
