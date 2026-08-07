import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Tag, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';
import { ProductCarousel } from '../components/ProductCarousel';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const cart = useNowCartStore((state) => state.cart);
  const updateCartQuantity = useNowCartStore((state) => state.updateCartQuantity);
  const removeFromCart = useNowCartStore((state) => state.removeFromCart);
  const clearCart = useNowCartStore((state) => state.clearCart);
  const products = useNowCartStore((state) => state.products);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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
      <div className="max-w-xl mx-auto py-24 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-success rounded-full flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-ink">Order Placed Successfully</h1>
        <p className="text-sm text-muted max-w-md mx-auto">
          Thank you for shopping with NowCart! Your personalized discovery order has been received and is being prepared.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-plum hover:bg-plum-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          Return to Shopping Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink font-sans flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-plum" />
            Shopping Cart Bag
          </h1>
          <p className="text-xs text-muted font-medium mt-1">
            {cart.length} unique articles in your session
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-plum hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-24 bg-white border border-subtle rounded-3xl p-12 space-y-4 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-muted mx-auto stroke-1" />
          <h2 className="text-xl font-bold text-ink">Your shopping bag is empty</h2>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Explore our AI-curated feed and find pieces tailored to your active style!
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3.5 bg-plum hover:bg-plum-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition-all"
          >
            Explore Curated Styles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.product_id}
                className="p-4 bg-white border border-subtle rounded-3xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <img
                  src={item.product.image_url}
                  alt={item.product.prod_name}
                  className="w-24 h-24 object-cover rounded-2xl shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-plum tracking-wider">
                    {item.product.brand || 'NowCart'}
                  </span>
                  <h3 className="text-sm font-extrabold text-ink truncate">
                    {item.product.prod_name}
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Size: {item.selectedSize || 'M'} | Color: {item.selectedColor || 'Black'}
                  </p>
                  <div className="text-base font-black text-ink font-mono mt-2">
                    ${(item.product.price || 39.99).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-bone p-1.5 rounded-2xl border border-subtle">
                  <button
                    onClick={() => updateCartQuantity(item.product.product_id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white text-ink font-bold shadow-sm hover:bg-gray-50 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold font-mono text-ink px-1">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.product_id, item.quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white text-ink font-bold shadow-sm hover:bg-gray-50 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.product_id)}
                  className="p-2 text-muted hover:text-error transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-subtle rounded-3xl p-6 shadow-sm space-y-6">
              
              <h3 className="font-extrabold text-base text-ink font-sans border-b border-subtle pb-3">
                Order Price Summary
              </h3>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Promo Code (NOWCART10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs border border-subtle rounded-xl uppercase font-mono font-bold text-ink focus:outline-none focus:border-plum"
                  />
                  <Tag className="w-3.5 h-3.5 text-muted absolute left-2.5 top-3" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-ink hover:bg-plum text-white rounded-xl text-xs font-bold"
                >
                  Apply
                </button>
              </form>

              {couponApplied && (
                <div className="flex items-center gap-1.5 text-xs text-success font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" /> 10% Discount Applied! Saved ${discountAmount.toFixed(2)}
                </div>
              )}

              <div className="space-y-2.5 text-xs text-muted font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-ink font-bold">${subtotal.toFixed(2)}</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-success font-bold">
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

                <div className="flex justify-between pt-3 border-t border-subtle text-base font-black text-ink">
                  <span>Total Amount</span>
                  <span className="font-mono text-plum">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-plum hover:bg-plum-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-plum/20 transition-all hover:scale-102"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
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
