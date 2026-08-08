import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Truck, Tag, Rotate3d, Layers, ArrowLeft } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCarousel } from '../components/ProductCarousel';
import { fetchBundle } from '../services/api';
import { BundleResponse } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useNowCartStore((state) => state.products);
  const addToCart = useNowCartStore((state) => state.addToCart);
  const toggleWishlist = useNowCartStore((state) => state.toggleWishlist);
  const isWishlisted = useNowCartStore((state) => state.isWishlisted(id || ''));
  const addRecentlyViewed = useNowCartStore((state) => state.addRecentlyViewed);

  const product = products.find((p) => p.product_id === id) || products[0];

  const [selectedImage, setSelectedImage] = useState<string>(product.image_url || '');
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'M');
  const [selectedColor] = useState<string>(product.colors?.[0] || 'Black');
  const [quantity, setQuantity] = useState<number>(1);
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [loadingBundle, setLoadingBundle] = useState<boolean>(false);
  const [is360Active, setIs360Active] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image_url || '');
      setSelectedSize(product.sizes?.[0] || 'M');
      setQuantity(1);
      setIs360Active(false);
      addRecentlyViewed(product);

      setLoadingBundle(true);
      fetchBundle(product.product_id)
        .then((data) => setBundle(data))
        .catch(() => setBundle(null))
        .finally(() => setLoadingBundle(false));
    }
  }, [id, product]);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const recommendedSameCategory = products.filter(
    (p) => p.category === product.category && p.product_id !== product.product_id
  );

  return (
    <div className="space-y-12 py-6 animate-fade-in">
      
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-muted hover:text-plum transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white shadow-sm border border-subtle">
            <img
              src={selectedImage || product.image_url}
              alt={product.prod_name}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                is360Active ? 'animate-spin-slow' : 'hover:scale-125 cursor-zoom-in'
              }`}
            />

            <button
              onClick={() => setIs360Active((prev) => !prev)}
              className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-md backdrop-blur transition-all ${
                is360Active ? 'bg-plum text-white' : 'bg-white/90 text-ink hover:bg-white'
              }`}
            >
              <Rotate3d className="w-4 h-4" />
              {is360Active ? '360° Rotating View' : '360° Preview'}
            </button>
          </div>

          {product.gallery && product.gallery.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
              {product.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === imgUrl ? 'border-plum scale-105 shadow-md' : 'border-subtle hover:border-muted'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="pt-8 border-t border-subtle space-y-4">
            <h3 className="text-lg font-black text-ink">Specifications & Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-bone rounded-xl">
                <span className="text-muted block mb-0.5">Article ID</span>
                <span className="font-mono font-bold text-ink">{product.product_id}</span>
              </div>
              <div className="p-3 bg-bone rounded-xl">
                <span className="text-muted block mb-0.5">Brand</span>
                <span className="font-bold text-ink">{product.brand || 'NowCart'}</span>
              </div>
              <div className="p-3 bg-bone rounded-xl">
                <span className="text-muted block mb-0.5">Category</span>
                <span className="font-bold text-ink">{product.category}</span>
              </div>
              <div className="p-3 bg-bone rounded-xl">
                <span className="text-muted block mb-0.5">Availability</span>
                <span className="font-bold text-success">In Stock</span>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed pt-2">{product.description}</p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-subtle rounded-3xl p-8 shadow-sm space-y-6">
            
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-plum">
                {product.brand || 'NowCart Collection'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-ink font-sans mt-1">
                {product.prod_name}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-gold text-xs font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.rating || 4.8}</span>
                </div>
                <span className="text-subtle">&bull;</span>
                <span className="text-xs text-muted font-medium">{product.reviews_count || 180} verified reviews</span>
              </div>
            </div>

            <div className="p-4 bg-bone rounded-2xl border border-subtle flex items-baseline gap-3">
              <span className="text-3xl font-black text-ink font-mono">${product.price?.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-sm font-medium text-muted line-through font-mono">
                  ${product.original_price.toFixed(2)}
                </span>
              )}
              <span className="px-3 py-1 text-xs font-black bg-gold-light text-gold rounded-full border border-gold/30">
                SAVE 20%
              </span>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 bg-plum-light border border-plum/20 rounded-2xl text-xs text-plum font-semibold">
              <Tag className="w-4 h-4 text-plum shrink-0" />
              <span>Use coupon code <strong>NOWCART10</strong> at checkout for 10% Off.</span>
            </div>

            {/* Size Swatch Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink" style={{ color: '#1C1B19' }}>
                  Select Size
                </label>
                <span className="text-[11px] font-semibold text-plum hover:underline cursor-pointer" style={{ color: '#6E2A3A' }}>
                  Size Guide
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {(product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL']).map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className="min-w-[48px] h-12 px-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center cursor-pointer shadow-xs"
                      style={
                        isSelected
                          ? { backgroundColor: '#6E2A3A', color: '#FFFFFF', borderColor: '#6E2A3A' }
                          : { backgroundColor: '#FFFFFF', color: '#1C1B19', borderColor: '#E7E2DB' }
                      }
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2" style={{ color: '#1C1B19' }}>
                Quantity
              </label>
              <div className="flex items-center gap-3 w-36 bg-bone p-1 rounded-2xl border border-subtle">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl bg-white text-ink font-bold shadow-sm hover:bg-gray-100 flex items-center justify-center text-sm"
                  style={{ backgroundColor: '#FFFFFF', color: '#1C1B19' }}
                >
                  -
                </button>
                <span className="flex-1 text-center text-xs font-extrabold font-mono text-ink" style={{ color: '#1C1B19' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-xl bg-white text-ink font-bold shadow-sm hover:bg-gray-100 flex items-center justify-center text-sm"
                  style={{ backgroundColor: '#FFFFFF', color: '#1C1B19' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold border"
              style={{ backgroundColor: '#EBF7F1', color: '#1B4D3E', borderColor: '#C2E8D5' }}
            >
              <Truck className="w-5 h-5 shrink-0" style={{ color: '#1B4D3E' }} />
              <span style={{ color: '#1B4D3E' }}>
                Express Delivery Available. Estimated arrival in <strong>2 business days</strong>.
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4 border-t border-subtle">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all cursor-pointer"
                style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
              >
                <ShoppingBag className="w-4 h-4 text-white" /> Add to Cart
              </button>

              <button
                onClick={() => {
                  handleAddToCart();
                  navigate('/cart');
                }}
                className="flex-1 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all cursor-pointer"
                style={{ backgroundColor: '#1C1B19', color: '#FFFFFF' }}
              >
                Buy Now
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-2xl border transition-colors flex items-center justify-center ${
                  isWishlisted ? 'bg-rose-50 border-rose-200 text-error' : 'border-subtle text-ink hover:bg-bone'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

          </div>

          <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-plum" />
              <h3 className="text-sm font-black uppercase tracking-wider text-ink">
                Complete the Look (RAG Styling Engine)
              </h3>
            </div>

            {loadingBundle ? (
              <div className="p-4 bg-bone rounded-2xl animate-pulse space-y-2">
                <div className="h-4 bg-subtle rounded w-3/4" />
                <div className="h-12 bg-subtle rounded w-full" />
              </div>
            ) : bundle && bundle.items.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-plum-light border border-plum/20 rounded-2xl text-xs text-plum leading-relaxed font-medium">
                  <strong className="text-plum font-bold block mb-1">Stylist Notes:</strong>
                  "{bundle.explanation}"
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {bundle.items.map((item) => (
                    <div
                      key={item.product_id}
                      onClick={() => navigate(`/product/${item.product_id}`)}
                      className="p-2 bg-bone hover:bg-plum-light/50 rounded-xl border border-subtle cursor-pointer transition-colors"
                    >
                      <img src={item.image_url} alt={item.prod_name} className="w-full aspect-square object-cover rounded-lg mb-1" />
                      <h4 className="text-[10px] font-bold text-ink truncate">{item.prod_name}</h4>
                      <span className="text-[10px] font-bold text-plum">${item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted italic">No complementary styling items found for this article.</p>
            )}
          </div>

        </div>

      </div>

      {recommendedSameCategory.length > 0 && (
        <ProductCarousel
          title="Recommended Outfits in Women"
          subtitle="More pieces you might love from this category"
          badge="SIMILAR STYLES"
          products={recommendedSameCategory}
          onOpenModal={(p) => navigate(`/product/${p.product_id}`)}
        />
      )}

    </div>
  );
};
