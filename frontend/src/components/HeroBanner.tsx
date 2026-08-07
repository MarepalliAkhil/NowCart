import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Star } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    tag: 'EDITORIAL FASHION EDITION 2026',
    title: 'Style tailored to your unique mood & momentum',
    subtitle: 'Picks that update live as you browse — the more you explore, the more personal your feed gets.',
    ctaMain: 'Shop Now',
    ctaSecondary: 'Explore Collection',
    bgGradient: 'from-ink via-ink/90 to-plum/40',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    featuredProduct: {
      name: 'Floral Evening Silk Dress',
      price: '$69.99',
      rating: '5.0',
      tag: '#1 Trending Choice',
    },
  },
  {
    id: 2,
    tag: 'COMPLETE THE LOOK',
    title: 'Outfit ideas styled around what you love',
    subtitle: 'Discover shoes, outerwear, and accessories that pair perfectly with every piece you browse.',
    ctaMain: 'View Outfit Ideas',
    ctaSecondary: 'Browse Styles',
    bgGradient: 'from-ink via-ink/90 to-gold/30',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=80',
    featuredProduct: {
      name: 'Leather Chelsea Boots',
      price: '$119.99',
      rating: '4.8',
      tag: 'Complete the Look',
    },
  },
  {
    id: 3,
    tag: 'SHOPPING YOU CAN TRUST',
    title: 'Transparent recommendations, no hidden agendas',
    subtitle: 'Your preferences stay yours — we surface great style without storing personal data or creating filter bubbles.',
    ctaMain: 'Shop with Confidence',
    ctaSecondary: 'Learn More',
    bgGradient: 'from-ink via-ink/90 to-slate-900/80',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    featuredProduct: {
      name: 'Canvas Utility Tote Bag',
      price: '$34.99',
      rating: '4.7',
      tag: 'Customer Favourite',
    },
  },
];

interface HeroBannerProps {
  onShopNow: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  const banner = BANNERS[currentSlide];

  return (
    <div className="relative w-full h-[650px] rounded-[32px] overflow-hidden bg-ink text-white shadow-xl mb-16 border border-subtle">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover object-center"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient}`} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-content-width h-full px-8 sm:px-12 lg:px-16 flex flex-col justify-between py-16">
        
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-gold-light rounded-full text-xs font-black uppercase tracking-widest shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            {banner.tag}
          </motion.div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-300">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Privacy-first shopping</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-6">
            <motion.h1
              key={`title-${banner.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white font-sans"
            >
              {banner.title}
            </motion.h1>

            <motion.p
              key={`sub-${banner.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed font-medium"
            >
              {banner.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pt-2 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={onShopNow}
                className="px-8 py-4 bg-plum hover:bg-plum-hover text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:scale-105"
              >
                <span>{banner.ctaMain}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onShopNow}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                {banner.ctaSecondary}
              </button>
            </motion.div>
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <motion.div
              key={`card-${banner.id}`}
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gold text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                  {banner.featuredProduct.tag}
                </span>
                <div className="flex items-center gap-1 text-gold text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{banner.featuredProduct.rating}</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white">{banner.featuredProduct.name}</h4>
                <p className="text-xl font-black font-mono text-gold-light mt-1">{banner.featuredProduct.price}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-300">
                <span>Live Picks</span>
                <span className="font-mono text-gold font-bold">98.6% Match</span>
              </div>
            </motion.div>
          </div>

        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === idx ? 'w-10 bg-plum' : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors"
              title="Previous Banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors"
              title="Next Banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
