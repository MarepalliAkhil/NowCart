import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCarousel } from '../components/ProductCarousel';
import { getCartCrossSellRecommendations } from '../utils/recommendations';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const cart = useNowCartStore((state) => state.cart);
  const addToCart = useNowCartStore((state) => state.addToCart);
  const updateCartQuantity = useNowCartStore((state) => state.updateCartQuantity);
  const removeFromCart = useNowCartStore((state) => state.removeFromCart);
  const clearCart = useNowCartStore((state) => state.clearCart);
  const products = useNowCartStore((state) => state.products);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const cartCrossSellItems = getCartCrossSellRecommendations(cart, products, 3);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price || 39.99) * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.1 : 0;
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 || cart.length === 0 ? 0 : 5.99;
  const total = Math.max(0, subtotal - discountAmount + tax + shipping);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'NOWCART10') {
      setCouponApplied(true);
    } else {
      alert('Invalid coupon code. Try using NOWCART10 for 10% off!');
    }
  };

  const handleCheckout = () => {
    setOrderSuccess(true);
    clearCart();
    setTimeout(() => {
      setOrderSuccess(false);
      navigate('/');
    }, 4000);
  };

  if (orderSuccess) {
    return (
      <div className="max-content-width px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-plum-light text-plum border border-plum/20 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: '#F5EBEF', color: '#6E2A3A' }}>
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-ink tracking-tight font-sans" style={{ color: '#1C1B19' }}>
          Order Confirmed!
        </h1>
        <p className="text-sm text-muted max-w-md mx-auto" style={{ color: '#6B665F' }}>
          Thank you for your order! Your personalized fashion recommendations are being processed.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3.5 rounded-2xl shadow-lg font-extrabold text-xs uppercase tracking-wider cursor-pointer"
          style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
        >
          Return to Shopping Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-content-width px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in">
      <div className="flex items-center justify-between border-b border-subtle pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight font-sans" style={{ color: '#1C1B19' }}>
            Shopping Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
          </h1>
          <p className="text-xs text-muted font-medium mt-1" style={{ color: '#6B665F' }}>
            Review your selected items and personalized recommendations
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
          style={{ color: '#6E2A3A' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: '#6E2A3A' }} /> Continue Shopping
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-24 bg-white border border-subtle rounded-3xl p-12 space-y-4 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-muted mx-auto stroke-1" style={{ color: '#6B665F' }} />
          <h2 className="text-xl font-bold text-ink" style={{ color: '#1C1B19' }}>Your shopping bag is empty</h2>
          <p className="text-xs text-muted max-w-sm mx-auto" style={{ color: '#6B665F' }}>
            Explore our AI-curated feed and find pieces tailored to your active style!
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-all font-extrabold text-xs uppercase tracking-wider cursor-pointer"
            style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
          >
            Explore Curated Styles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.product_id}
                  className="p-4 bg-white border border-subtle rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.prod_name}
                    className="w-20 h-24 object-cover rounded-2xl shrink-0 bg-bone"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted" style={{ color: '#6B665F' }}>
                      {item.product.brand}
                    </span>
                    <h3 className="font-bold text-sm text-ink truncate" style={{ color: '#1C1B19' }}>{item.product.prod_name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-black text-ink font-mono" style={{ color: '#1C1B19' }}>${item.product.price?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-bone p-1 rounded-xl border border-subtle">
                      <button
                        onClick={() => updateCartQuantity(item.product.product_id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-white text-ink font-bold shadow-xs hover:bg-gray-100 flex items-center justify-center text-xs"
                        style={{ backgroundColor: '#FFFFFF', color: '#1C1B19' }}
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono px-1" style={{ color: '#1C1B19' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.product_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white text-ink font-bold shadow-xs hover:bg-gray-100 flex items-center justify-center text-xs"
                        style={{ backgroundColor: '#FFFFFF', color: '#1C1B19' }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.product_id)}
                      className="p-2 text-muted hover:text-error transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Goes Well With Your Cart Cross-Sell Section */}
            {cartCrossSellItems.length > 0 && (
              <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-subtle pb-3">
                  <Sparkles className="w-5 h-5" style={{ color: '#6E2A3A' }} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-ink" style={{ color: '#1C1B19' }}>
                    Goes Well With Your Cart
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {cartCrossSellItems.map(({ product: item, reason }) => (
                    <div
                      key={item.product_id}
                      className="p-3 border border-subtle rounded-2xl bg-bone flex flex-col justify-between space-y-2 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex gap-3 items-center">
                        <img
                          src={item.image_url}
                          alt={item.prod_name}
                          className="w-14 h-16 object-cover rounded-xl shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-ink truncate" style={{ color: '#1C1B19' }}>{item.prod_name}</h4>
                          <span className="text-xs font-mono font-bold text-ink" style={{ color: '#1C1B19' }}>${item.price?.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold p-1.5 rounded-xl border flex items-center gap-1" style={{ color: '#6E2A3A', backgroundColor: '#F5EBEF', borderColor: '#F5EBEF' }}>
                        <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#6E2A3A' }} />
                        <span className="truncate">{reason}</span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-white" /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-6 sticky top-24">
              <h3 className="font-extrabold text-base text-ink border-b border-subtle pb-3" style={{ color: '#1C1B19' }}>
                Order Summary
              </h3>

              <form onSubmit={handleApplyCoupon} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. NOWCART10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-subtle rounded-xl bg-bone focus:outline-none focus:border-plum uppercase font-mono font-bold"
                    style={{ backgroundColor: '#F7F5F2', color: '#1C1B19' }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: '#1C1B19', color: '#FFFFFF' }}
                  >
                    Apply
                  </button>
                </div>

                {couponApplied && (
                  <div className="text-xs font-bold flex items-center justify-between" style={{ color: '#2F6E4F' }}>
                    <span>Coupon NOWCART10 Applied (10% Off)</span>
                    <button type="button" onClick={() => setCouponApplied(false)} className="text-error underline text-[10px]" style={{ color: '#A6402A' }}>Remove</button>
                  </div>
                )}
              </form>

              <div className="space-y-3 text-xs font-semibold text-muted" style={{ color: '#6B665F' }}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold" style={{ color: '#1C1B19' }}>${subtotal.toFixed(2)}</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between font-bold" style={{ color: '#2F6E4F' }}>
                    <span>Discount (NOWCART10)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-mono font-bold">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between pt-3 border-t border-subtle text-base font-black" style={{ color: '#1C1B19' }}>
                  <span>Total Amount</span>
                  <span className="font-mono" style={{ color: '#6E2A3A' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-all cursor-pointer"
                style={{ backgroundColor: '#6E2A3A', color: '#FFFFFF' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

            </div>
          </div>

        </div>
      )}

      <ProductCarousel
        title="Recommended Add-ons For Your Cart"
        subtitle="Frequently paired accessories and essentials"
        badge="ADD-ONS"
        products={products.filter((p) => p.category === 'Accessories').slice(0, 6)}
        onOpenModal={(p) => navigate(`/product/${p.product_id}`)}
      />

    </div>
  );
};
