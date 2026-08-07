import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DevAiPanel } from './components/DevAiPanel';
import { ToastContainer } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CategoryPage } from './pages/CategoryPage';
import { ToastMessage } from './types';

export default function App() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Expose addToast to window so ProductCard/cart actions can fire toasts
  useEffect(() => {
    (window as any).__nowcartToast = addToast;
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bone text-ink flex flex-col font-sans selection:bg-plum selection:text-white">

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

        {/* Sticky 80px Navigation Bar */}
        <Navbar />

        {/* Main 1440px Centered Router Content */}
        <main className="flex-1 max-content-width w-full px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/category/:name" element={<CategoryPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-20 bg-white border-t border-subtle py-12">
          <div className="max-content-width w-full px-4 text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <span className="text-xl font-black text-ink">Now<span className="text-plum">Cart</span></span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-plum-light text-plum rounded-full border border-plum/20">Platform</span>
            </div>
            <p className="text-xs text-muted max-w-md mx-auto">
              Real-time personalized shopping &amp; style discovery — built for the way you browse.
            </p>
            <div className="text-[11px] text-muted font-mono">
              NowCart &copy; 2026 &bull; All Rights Reserved
            </div>
          </div>
        </footer>

        {/* Slide-out Dev AI Panel */}
        <DevAiPanel />

      </div>
    </BrowserRouter>
  );
}
