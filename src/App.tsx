import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';

// Pages
import Home from './pages/Home.js';
import PromotionBanner from './components/PromotionBanner.js';

import { Package, GallerySong, ClientReview, PromotionSettings } from './types.js';
import { useSEO, useJsonLd } from './hooks/useSEO.js';
import { signalerVue } from './lib/visiteur.js';
import {
  initMetaPixel,
  trackPageView,
  trackViewContent,
  trackContact,
} from './lib/metaPixel.js';
import WhatsAppButton from './components/WhatsAppButton.js';
import { api } from './lib/api.js';
import { memeContenu } from './lib/egalite.js';
import { FournisseurNotifications } from './components/Notifications.js';
import {
  PAGE_PATHS,
  pathToPage,
  getRouteSeo,
  getPackSeo,
  slugToPackId,
} from './seo/routes.js';

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
const PackagePage = lazy(() => import('./pages/PackagePage.js'));
const Account = lazy(() => import('./pages/Account.js'));
const MyAccount = lazy(() => import('./pages/MyAccount.js'));
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
    <div className="flex items-center justify-center py-40 text-[#7E8894] gap-3 text-sm">
      <Loader2 className="w-4 h-4 animate-spin text-[#A3FF12]" />
      Chargement…
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [memorySlug, setMemorySlug] = useState('maman-georgette');
  const [packSlug, setPackSlug] = useState('');
  const [clientConnecte, setClientConnecte] = useState<boolean | null>(null);

  /**
   * Le routeur a-t-il lu l'adresse une première fois ?
   *
   * L'application démarre toujours sur « accueil » avant d'analyser l'URL.
   * Sans ce verrou, une visite directe sur /tarifs envoie un premier
   * PageView pour « / », puis un second pour « /tarifs » : Meta compte une
   * page vue qui n'a jamais existé, et l'attribution devient fausse.
   */
  const [routeurPret, setRouteurPret] = useState(false);

  /**
   * Barre d'appel fixe (mobile).
   *
   * Elle n'apparaît qu'une fois le héros dépassé : au chargement, elle
   * recouvrait le bouton « Commander ma chanson » du héros et proposait
   * exactement la même action. Deux boutons identiques superposés, dont
   * un à moitié caché, donnent l'impression d'un défaut d'affichage.
   */
  const [afficherCtaFixe, setAfficherCtaFixe] = useState(false);

  /**
   * Référencement de l'écran courant.
   *
   * Sans cela, toutes les pages partageraient le titre de l'accueil : un lien
   * envoyé sur WhatsApp afficherait toujours la même chose, et Google
   * n'indexerait qu'une seule page.
   */
  const packIdForSeo = currentPage === 'pack' ? slugToPackId(packSlug) : undefined;
  const seoPack = packIdForSeo ? getPackSeo(packIdForSeo) : undefined;
  const seo = seoPack ?? getRouteSeo(currentPage);

  /**
   * Les écrans de compte sont personnels : les laisser dans les résultats
   * de recherche n'apporterait aucun visiteur et exposerait des adresses
   * qui n'ont de sens que pour la personne connectée.
   */
  const ecranPrive = currentPage === 'account' || currentPage === 'myaccount' || currentPage === 'admin';

  useSEO({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    noindex: ecranPrive,
  });

  // Shared Data States fetched from server
  const [packages, setPackages] = useState<Package[]>([]);
  const [gallerySongs, setGallerySongs] = useState<GallerySong[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<ClientReview[]>([]);

  /**
   * Données structurées « avis ».
   *
   * C'est ce bloc qui permet à Google d'afficher des étoiles sous votre lien.
   * Il est généré depuis les avis réellement approuvés : tant que la section
   * est vide, aucun bloc n'est émis — et donc aucune fausse note affichée.
   * Dès le premier avis validé, les étoiles apparaissent sans autre intervention.
   */
  const reviewLd = useMemo(() => {
    const approved = featuredReviews.filter((r) => r.approved && r.rating > 0);
    if (approved.length === 0) return null;

    const total = approved.reduce((sum, r) => sum + r.rating, 0);
    const average = (total / approved.length).toFixed(1);

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'VOXMORY',
      image: 'https://saa-s-voxmory.vercel.app/og-image.jpg',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: average,
        reviewCount: String(approved.length),
        bestRating: '5',
        worstRating: '1',
      },
      review: approved.slice(0, 10).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.clientName },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: String(r.rating),
          bestRating: '5',
        },
        reviewBody: r.comment,
      })),
    };
  }, [featuredReviews]);

  useJsonLd('voxmory-reviews', reviewLd);

  /**
   * Données structurées « service » et « questions fréquentes ».
   *
   * Ce sont ces blocs qui font apparaître, sous le lien dans Google, les
   * questions dépliables et les informations de service. Deux pages
   * concurrentes à contenu égal se départagent souvent là-dessus.
   *
   * Elles décrivent des prestations réellement proposées : les formules
   * viennent du serveur, et le tarif publicitaire est celui que le serveur
   * applique. Une réponse inventée serait une promesse non tenue.
   */
  const serviceLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Chanson personnalisée VOXMORY',
      serviceType: 'Création musicale sur-mesure',
      provider: {
        '@type': 'LocalBusiness',
        name: 'VOXMORY Studio',
        areaServed: 'République démocratique du Congo',
      },
      areaServed: { '@type': 'Country', name: 'République démocratique du Congo' },
      offers: packages.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        description: `${p.promise} — livraison : ${p.deliveryTime}.`,
        price: (p.priceCents / 100).toFixed(2),
        priceCurrency: p.currency || 'USD',
        availability: 'https://schema.org/InStock',
      })),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Chanson publicitaire pour entreprises',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'PUB — Chanson pour entreprises',
            description:
              'Jingle de marque écrit sur mesure : votre slogan, votre activité, livré prêt à diffuser.',
            price: '35.00',
            priceCurrency: 'USD',
          },
        ],
      },
    }),
    [packages],
  );

  const faqLd = useMemo(() => {
    const laMoinsChere = packages.reduce(
      (min, p) => (p.priceCents < min ? p.priceCents : min),
      packages[0]?.priceCents ?? 0,
    );

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Combien coûte une chanson personnalisée ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              laMoinsChere > 0
                ? `Nos formules commencent à ${(laMoinsChere / 100).toLocaleString('fr-FR')} $. La chanson publicitaire pour entreprises est un forfait unique de 35 $.`
                : 'Consultez la page Tarifs : quatre formules, du simple au live.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de temps faut-il pour recevoir ma chanson ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Selon la formule choisie, la livraison intervient en quelques jours. Vous suivez l’avancement à chaque étape depuis votre numéro de commande.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment raconter mon histoire ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Trois moyens : écrivez-la, déposez une note vocale, ou dites-la de vive voix sur WhatsApp. Le plus court chemin est souvent la voix.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment vais-je recevoir ma chanson ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Par WhatsApp, le moyen le plus simple en RDC. Sans WhatsApp, nous l’envoyons par e-mail.',
          },
        },
        {
          '@type': 'Question',
          name: 'Puis-je commander une chanson pour mon entreprise ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Choisissez l’occasion « PUB — Chanson pour entreprises » : nous écrivons un jingle pour votre marque, au forfait de 35 $.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment payer ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Par Mobile Money ou par carte bancaire, via une page de paiement sécurisée.',
          },
        },
      ],
    };
  }, [packages]);

  useJsonLd('voxmory-service', serviceLd);
  useJsonLd('voxmory-faq', faqLd);
  const [promotion, setPromotion] = useState<PromotionSettings | null>(null);

  // Dynamically initialize Google Analytics from environment variables
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-Z0D54XEMDR';
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
        page_path: window.location.pathname || '/',
      });
    }
  }, []);

  // Track page views on route changes (Google Analytics)
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-Z0D54XEMDR';
    if (window.gtag && gaId) {
      const pagePath = window.location.pathname || '/';
      window.gtag('config', gaId, {
        page_path: pagePath,
        page_title: document.title,
      });
    }
  }, [currentPage]);

  /**
   * Routage par vrais chemins (au lieu de « # »).
   *
   * Un moteur de recherche ignore tout ce qui suit un « # » : avec l'ancien
   * système, /#tarifs, /#avis et /#exemples étaient une seule et même page à
   * ses yeux. En passant par de vrais chemins, chaque écran devient une page
   * distincte, indexable et partageable.
   */
  useEffect(() => {
    const parseLocation = () => {
      const { page, param } = pathToPage(window.location.pathname);

      setCurrentPage(page);
      if (page === 'memory' && param) setMemorySlug(param);
      if (page === 'pack' && param) setPackSlug(param);
      // Retour de paiement : /suivi/<jeton> pré-remplit la recherche.
      if (page === 'tracking' && param) setPageParams({ id: param });

      setRouteurPret(true);
    };

    window.addEventListener('popstate', parseLocation);
    parseLocation(); // Lecture initiale

    return () => window.removeEventListener('popstate', parseLocation);
  }, []);

  // Chaque changement de page repart du haut, sans quoi on atterrit au milieu.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, memorySlug]);

  /**
   * Mesure d'audience.
   *
   * Le chemin réel est transmis, et non l'identifiant interne de l'écran :
   * sans cela, /pack/chanson-simple et /pack/premium-vip se confondraient
   * et l'on ne saurait jamais quelle formule intéresse les gens.
   */
  useEffect(() => {
    if (!routeurPret) return;
    signalerVue(window.location.pathname || '/');
  }, [routeurPret, currentPage, packSlug, memorySlug]);

  /* ================================================================== */
  /*  Mesure Meta (pixel + API Conversions)                             */
  /* ================================================================== */

  useEffect(() => {
    // Idempotent : sans identifiant de pixel configuré, ne fait rien.
    initMetaPixel();
  }, []);

  /**
   * Vue de page et vue de contenu à **chaque** changement de route.
   *
   * Une application monopage ne recharge jamais le document : sans ce
   * déclenchement explicite, Meta ne verrait qu'une seule page vue par
   * visite, quel que soit le nombre d'écrans traversés — et le pixel
   * serait incapable d'attribuer une commande à la formule consultée.
   */
  useEffect(() => {
    if (!routeurPret) return;
    trackPageView(window.location.pathname || '/');
  }, [routeurPret, currentPage, packSlug, memorySlug]);

  /**
   * Vue de contenu, une seule fois par écran.
   *
   * Sur une page de formule, on attend que les prix soient chargés pour
   * envoyer la valeur : sinon l'événement partirait sans montant, et Meta
   * ne pourrait pas optimiser sur le panier. Une référence mémorise ce qui
   * a déjà été envoyé pour éviter les doublons au rechargement des données.
   */
  const vueContenuEnvoyee = useRef('');

  useEffect(() => {
    if (!routeurPret) return;

    const chemin = window.location.pathname || '/';
    const estPageFormule = currentPage === 'pack' && Boolean(packIdForSeo);
    const formule = packIdForSeo ? packages.find((p) => p.id === packIdForSeo) : undefined;

    // Page de formule sans prix connu : on attend la réponse du serveur.
    if (estPageFormule && packages.length === 0) return;

    const cle = `${chemin}|${formule?.id ?? currentPage}`;
    if (vueContenuEnvoyee.current === cle) return;
    vueContenuEnvoyee.current = cle;

    if (formule) {
      trackViewContent(chemin, {
        id: formule.id,
        name: formule.name,
        value: formule.priceCents / 100,
        currency: formule.currency,
      });
    } else {
      trackViewContent(chemin, { id: currentPage, name: seo.title });
    }
  }, [routeurPret, currentPage, packSlug, memorySlug, packages, seo, packIdForSeo]);

  /**
   * Prise de contact.
   *
   * Le clic sur un lien WhatsApp est le vrai début du parcours commercial :
   * c'est l'équivalent d'un formulaire envahi. On l'écoute au niveau du
   * document plutôt que dans chaque composant — les liens WhatsApp
   * existent dans huit endroits différents et un seul oubli fausserait la
   * mesure.
   */
  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      const cible = e.target as HTMLElement | null;
      const lien = cible?.closest?.('a') as HTMLAnchorElement | null;
      if (!lien) return;

      const href = lien.getAttribute('href') ?? '';
      if (!/^https:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href)) return;

      trackContact(
        window.location.pathname || '/',
        (lien.textContent ?? '').trim().slice(0, 80) || undefined,
      );
    };

    document.addEventListener('click', surClic, true);
    return () => document.removeEventListener('click', surClic, true);
  }, []);

  /**
   * Le visiteur est-il connu ?
   *
   * La réponse n'est connue qu'après un aller-retour serveur. Tant qu'on
   * ne sait pas, on n'affiche rien plutôt que de montrer « Connexion » à
   * quelqu'un qui est déjà connecté — le bouton clignoterait à chaque
   * chargement.
   */
  useEffect(() => {
    api.account
      .me()
      .then(() => setClientConnecte(true))
      .catch(() => setClientConnecte(false));
  }, []);

  /**
   * Chargement initial — et synchronisation continue.
   *
   * Ces quatre collections changent depuis le studio pendant que le
   * visiteur a la page ouverte. On les relit donc périodiquement : une
   * chanson publiée ou une promotion lancée apparaît sans que personne
   * n'ait à recharger.
   */
  const chargerDonnees = useCallback(async () => {
    const [pkgs, chansons, avis, promo] = await Promise.all([
      api.packages(),
      api.gallery(),
      api.reviews(),
      api.promotion(),
    ]);

    setPackages((actuel) => (memeContenu(actuel, pkgs) ? actuel : pkgs));
    setGallerySongs((actuel) => (memeContenu(actuel, chansons) ? actuel : chansons));

    const visibles = avis.filter((r) => r.approved === true).slice(0, 6);
    setFeaturedReviews((actuel) => (memeContenu(actuel, visibles) ? actuel : visibles));

    setPromotion((actuel) => (memeContenu(actuel, promo) ? actuel : promo));
  }, []);

  useEffect(() => {
    let minuteur: ReturnType<typeof setInterval> | null = null;

    const lancer = () => {
      chargerDonnees().catch(() => {
        /* Une panne passagère garde l'écran affiché : on retentera. */
      });
    };

    const arreter = () => {
      if (minuteur !== null) {
        clearInterval(minuteur);
        minuteur = null;
      }
    };

    const demarrer = () => {
      if (minuteur === null) {
        // Une minute : assez rapide pour une promotion, assez lent pour
        // ne pas peser sur la connexion d'un téléphone.
        minuteur = setInterval(() => {
          if (document.visibilityState === 'visible') lancer();
        }, 60_000);
      }
    };

    // On ne synchronise que si l'onglet est visible. Un onglet caché ne
    // montrerait rien de ce qu'il télécharge.
    const surVisibilite = () => {
      if (document.visibilityState === 'visible') {
        lancer();
        demarrer();
      } else {
        arreter();
      }
    };

    lancer();
    if (document.visibilityState === 'visible') demarrer();

    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('online', lancer);

    return () => {
      arreter();
      document.removeEventListener('visibilitychange', surVisibilite);
      window.removeEventListener('online', lancer);
    };
  }, [chargerDonnees]);

  useEffect(() => {
    const surDefilement = () => setAfficherCtaFixe(window.scrollY > 520);
    surDefilement();
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, []);

  // Handle direct router triggers with state arguments
  const handleNavigate = (page: string, params: any = null) => {
    setPageParams(params);

    // Construction de l'adresse publique, puis navigation sans rechargement.
    let url = PAGE_PATHS[page] ?? `/${page}`;
    if (page === 'memory' && params?.slug) {
      setMemorySlug(params.slug);
      url = `/memory/${params.slug}`;
    }
    if (page === 'pack' && params?.slug) {
      setPackSlug(params.slug);
      url = `/pack/${params.slug}`;
    }

    window.history.pushState({}, '', url);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  /**
   * Chansons proposées à la page d'accueil.
   *
   * On transmet jusqu'à dix titres : c'est le studio qui décide combien en
   * montrer. Couper ici à trois rendait le réglage « dix » inopérant — la
   * page n'aurait jamais eu assez de matière.
   */
  const getFeaturedSongs = () => {
    const featured = gallerySongs.filter((s) => s.isFeatured);
    return featured.length > 0 ? featured : gallerySongs.slice(0, 10);
  };

  return (
    <FournisseurNotifications>
    <div className="relative min-h-screen bg-[#07080A] text-white flex flex-col justify-between selection:bg-[#A3FF12] selection:text-[#06080A] grain">
      {/* Lien d'évitement : visible au premier Tab, il laisse passer la
          barre de navigation et va droit au contenu. */}
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>
      {/* Fond ambiant : deux halos fixes donnent de la profondeur à chaque page */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[45rem] h-[45rem] rounded-full bg-[#A3FF12]/[0.045] blur-[150px]" />
        <div className="absolute -bottom-56 -right-32 w-[42rem] h-[42rem] rounded-full bg-[#0B3D1E]/45 blur-[160px]" />
      </div>

      {/* Promotion Announcement / Ticker Banner */}
      <PromotionBanner promotion={promotion} onNavigate={handleNavigate} />

      {/* Dynamic Header Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        clientConnecte={clientConnecte}
      />

      {/* Main Page Canvas */}
      <main id="contenu" tabIndex={-1} className="flex-grow relative outline-none">
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

            {/* Page propre à une formule : /pack/chanson-simple */}
            {currentPage === 'pack' &&
              (() => {
                const packId = slugToPackId(packSlug);
                const pack = packages.find((p) => p.id === packId);
                if (!pack) {
                  return <Pricing packages={packages} onNavigate={handleNavigate} />;
                }
                return (
                  <PackagePage
                    pkg={pack}
                    reviews={featuredReviews}
                    onNavigate={handleNavigate}
                  />
                );
              })()}

            {currentPage === 'memory' && (
              <MemoryPageComp slug={memorySlug} onNavigate={handleNavigate} />
            )}

            {currentPage === 'tracking' && (
              <Tracking initialOrderId={pageParams?.id || ''} onNavigate={handleNavigate} />
            )}

            {currentPage === 'account' && (
              <Account
                onAuthenticated={() => {
                  setClientConnecte(true);
                  handleNavigate('myaccount');
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'myaccount' && (
              <MyAccount
                onNavigate={handleNavigate}
                onLoggedOut={() => {
                  setClientConnecte(false);
                  handleNavigate('home');
                }}
              />
            )}

            {currentPage === 'admin' && (
              <Admin onNavigate={handleNavigate} onPromotionChanged={() => void chargerDonnees()} />
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

      {/*
        Bouton flottant. Retiré du studio et de l'espace client : là, le
        visiteur est déjà en train de faire quelque chose, et un bouton qui
        discute n'aide personne.
      */}
      <WhatsAppButton masquer={currentPage === 'admin'} />

      {/* Mobile Sticky CTA */}
      <AnimatePresence>
        {PAGES_WITH_STICKY_CTA.includes(currentPage) && afficherCtaFixe && (
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
    </FournisseurNotifications>
  );
}
