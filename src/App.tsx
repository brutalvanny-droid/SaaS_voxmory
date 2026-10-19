import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';

// Pages
import Home from './pages/Home.js';
import OrderForm from './pages/OrderForm.js';
import Gallery from './pages/Gallery.js';
import Reviews from './pages/Reviews.js';
import Pricing from './pages/Pricing.js';
import MemoryPageComp from './pages/MemoryPage.js';
import Tracking from './pages/Tracking.js';
import InstallGuide from './pages/InstallGuide.js';
import PromotionBanner from './components/PromotionBanner.js';

import { Package, GallerySong, ClientReview, PromotionSettings } from './types.js';

// Le studio d'administration représente une part importante du code et
// n'intéresse qu'un utilisateur sur mille : il est chargé à la demande, ce
// qui allège d'autant le premier affichage pour les visiteurs, souvent en 3G.
const Admin = lazy(() => import('./pages/Admin.js'));

// Extend Window interface for Google Analytics tracking
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [memorySlug, setMemorySlug] = useState('maman-georgette');

  // Shared Data States fetched from server
  const [packages, setPackages] = useState<Package[]>([]);
  const [gallerySongs, setGallerySongs] = useState<GallerySong[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<ClientReview[]>([]);
  const [promotion, setPromotion] = useState<PromotionSettings | null>(null);

  // Dynamically initialize Google Analytics from environment variables
  useEffect(() => {
    const gaId = (import.meta as any).env.VITE_GA_MEASUREMENT_ID || 'G-Z0D54XEMDR';
    if (!gaId) return;

    const scriptId = 'google-analytics-gtag';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, {
        page_path: window.location.hash || '#home'
      });
    }
  }, []);

  // Track page views on route changes (Google Analytics)
  useEffect(() => {
    const gaId = (import.meta as any).env.VITE_GA_MEASUREMENT_ID || 'G-Z0D54XEMDR';
    if (window.gtag && gaId) {
      const pagePath = window.location.hash || '#home';
      window.gtag('config', gaId, {
        page_path: pagePath,
        page_title: `${currentPage.toUpperCase()} | VOXMORY`
      });
    }
  }, [currentPage]);

  // Hash-based routing implementation
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash || '#home';
      const cleanHash = hash.replace('#', '');
      const parts = cleanHash.split('/');
      const page = parts[0] || 'home';
      const param = parts[1] || '';

      setCurrentPage(page);
      if (page === 'memory' && param) {
        setMemorySlug(param);
      }
    };

    window.addEventListener('hashchange', parseHash);
    parseHash(); // Initial check

    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Track page visits
  useEffect(() => {
    fetch('/api/stats/visit', { method: 'POST' }).catch(() => {});
  }, [currentPage]);

  const loadInitialData = async () => {
    try {
      const [pkgsRes, galleryRes, reviewsRes, promoRes] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/gallery'),
        fetch('/api/reviews'),
        fetch('/api/promotion')
      ]);

      if (pkgsRes.ok) {
        const pkgs = await pkgsRes.json();
        setPackages(pkgs);
      }
      if (galleryRes.ok) {
        const songs = await galleryRes.json();
        setGallerySongs(songs);
      }
      if (reviewsRes.ok) {
        const revs = await reviewsRes.json();
        // Select only a few featured reviews
        setFeaturedReviews(revs.filter((r: any) => r.approved === true).slice(0, 3));
      }
      if (promoRes.ok) {
        const promo = await promoRes.json();
        setPromotion(promo);
      }
    } catch (err) {
      console.error('Error loading initial data in App.tsx', err);
    }
  };

  // Fetch initial collections
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle direct router triggers with state arguments
  const handleNavigate = (page: string, params: any = null) => {
    setPageParams(params);
    if (page === 'memory' && params?.slug) {
      setMemorySlug(params.slug);
      window.location.hash = `#memory/${params.slug}`;
    } else {
      window.location.hash = `#${page}`;
    }
  };

  const getFeaturedSongs = () => {
    const featured = gallerySongs.filter(s => s.isFeatured);
    return featured.length > 0 ? featured : gallerySongs.slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white flex flex-col justify-between selection:bg-yellow-400 selection:text-black">
      
      {/* Promotion Announcement / Ticker Banner */}
      <PromotionBanner promotion={promotion} onNavigate={handleNavigate} />

      {/* Dynamic Header Navbar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Page Canvas */}
      <main className={`flex-grow ${['home', 'gallery', 'reviews', 'pricing', 'memory'].includes(currentPage) ? 'pb-24 md:pb-0' : ''}`}>
        {currentPage === 'home' && (
          <Home
            packages={packages}
            featuredSongs={getFeaturedSongs()}
            featuredReviews={featuredReviews}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'order' && (
          <OrderForm
            packages={packages}
            initialParams={pageParams}
            onNavigate={(page) => handleNavigate(page)}
            onSubmitSuccess={(orderId) => handleNavigate('tracking', { id: orderId })}
          />
        )}

        {currentPage === 'gallery' && (
          <Gallery
            initialSongs={gallerySongs}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'reviews' && (
          <Reviews
            initialReviews={featuredReviews}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'pricing' && (
          <Pricing
            packages={packages}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'memory' && (
          <MemoryPageComp
            slug={memorySlug}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'tracking' && (
          <Tracking
            initialOrderId={pageParams?.id || ''}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'admin' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-32 text-gray-500 gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement du studio…
              </div>
            }
          >
            <Admin onNavigate={handleNavigate} onPromotionChanged={loadInitialData} />
          </Suspense>
        )}

        {currentPage === 'install' && (
          <InstallGuide
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Footer Block */}
      <Footer onNavigate={(page) => handleNavigate(page)} />

      {/* Mobile Sticky CTA */}
      <AnimatePresence>
        {['home', 'gallery', 'reviews', 'pricing', 'memory'].includes(currentPage) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0a0a0d] border-t border-white/10 flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.9)]"
          >
            <div className="flex flex-col">
              <span className="text-[9px] text-yellow-400 font-mono font-bold uppercase tracking-widest">Voxmory Studio</span>
              <h5 className="text-[13px] font-extrabold text-white leading-tight">Votre Rumba Sur-Mesure</h5>
            </div>
            <button
              onClick={() => handleNavigate('order')}
              className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-sans font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Commander</span>
              <span className="text-[14px]">🎵</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
