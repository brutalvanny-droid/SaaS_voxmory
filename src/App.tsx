import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';

// Pages
import Home from './pages/Home.js';
import PromotionBanner from './components/PromotionBanner.js';

import { Package, GallerySong, ClientReview, PromotionSettings } from './types.js';

// Seule la page d'accueil est chargée d'emblée. Toutes les autres — y compris
// le studio d'administration — sont chargées à la demande : le visiteur qui
// arrive ne paie que l'accueil. Sur une 3G, la différence se compte en
// secondes entières.
const OrderForm = lazy(() => import('./pages/OrderForm.js'));
const Gallery = lazy(() => import('./pages/Gallery.js'));
const Reviews = lazy(() => import('./pages/Reviews.js'));
const Pricing = lazy(() => import('./pages/Pricing.js'));
const MemoryPageComp = lazy(() => import('./pages/MemoryPage.js'));
const Tracking = lazy(() => import('./pages/Tracking.js'));
const InstallGuide = lazy(() => import('./pages/InstallGuide.js'));
const Admin = lazy(() => import('./pages/Admin.js'));

// Extend Window interface for Google Analytics tracking
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const PAGES_WITH_STICKY_CTA = ['home', 'gallery', 'reviews', 'pricing', 'memory'];

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-40 text-[#6C7581] gap-3 text-sm">
      <Loader2 className="w-4 h-4 animate-spin text-[#A3FF12]" />
      Chargement…
    </div>
  );
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
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, {
        page_path: window.location.hash || '#home',
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
        page_title: `${currentPage.toUpperCase()} | VOXMORY`,
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

  // Chaque changement de page repart du haut, sans quoi on atterrit au milieu.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, memorySlug]);

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
        fetch('/api/promotion'),
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
    const featured = gallerySongs.filter((s) => s.isFeatured);
    return featured.length > 0 ? featured : gallerySongs.slice(0, 3);
  };

  return (
    <div className="relative min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#A3FF12] selection:text-[#06080A] grain">
      {/* Fond ambiant : deux halos fixes donnent de la profondeur à chaque page */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[45rem] h-[45rem] rounded-full bg-[#A3FF12]/[0.045] blur-[150px]" />
        <div className="absolute -bottom-56 -right-32 w-[42rem] h-[42rem] rounded-full bg-[#0B3D1E]/45 blur-[160px]" />
      </div>

      {/* Promotion Announcement / Ticker Banner */}
      <PromotionBanner promotion={promotion} onNavigate={handleNavigate} />

      {/* Dynamic Header Navbar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Page Canvas */}
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage === 'memory' ? `memory-${memorySlug}` : currentPage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={PAGES_WITH_STICKY_CTA.includes(currentPage) ? 'pb-28 md:pb-0' : ''}
          >
            <Suspense fallback={<PageLoader />}>
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
              <Gallery initialSongs={gallerySongs} onNavigate={handleNavigate} />
            )}

            {currentPage === 'reviews' && (
              <Reviews initialReviews={featuredReviews} onNavigate={handleNavigate} />
            )}

            {currentPage === 'pricing' && (
              <Pricing packages={packages} onNavigate={handleNavigate} />
            )}

            {currentPage === 'memory' && (
              <MemoryPageComp slug={memorySlug} onNavigate={handleNavigate} />
            )}

            {currentPage === 'tracking' && (
              <Tracking initialOrderId={pageParams?.id || ''} onNavigate={handleNavigate} />
            )}

            {currentPage === 'admin' && (
              <Admin onNavigate={handleNavigate} onPromotionChanged={loadInitialData} />
            )}

            {currentPage === 'install' && (
              <InstallGuide onNavigate={handleNavigate} />
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer Block */}
      <Footer onNavigate={(page) => handleNavigate(page)} />

      {/* Mobile Sticky CTA */}
      <AnimatePresence>
        {PAGES_WITH_STICKY_CTA.includes(currentPage) && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-[#0B0D10]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-between gap-4 shadow-[0_-12px_40px_rgba(0,0,0,0.85)]"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-[#A3FF12] font-mono font-bold uppercase tracking-[0.18em]">
                Voxmory Studio
              </span>
              <h5 className="text-[13.5px] font-extrabold text-white leading-tight tracking-tight truncate">
                Votre chanson sur-mesure
              </h5>
            </div>
            <button
              onClick={() => handleNavigate('order')}
              className="group shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-b from-[#C8FF4D] to-[#96F00A] text-[#06080A] text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_8px_24px_-8px_rgba(163,255,18,0.6)] active:scale-95 transition-all"
            >
              Commander
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
