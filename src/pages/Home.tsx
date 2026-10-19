import { useState, useEffect } from 'react';
import { Music, MessageCircle, Mic, Gift, Flame, Sparkles, Heart, Star, Award, ChevronRight, ChevronLeft, GraduationCap, ShieldCheck, ThumbsUp, Users, RefreshCw, Check, Shield, Baby, HeartHandshake, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AudioPlayer from '../components/AudioPlayer.js';
import { Package, GallerySong, ClientReview } from '../types.js';
import { useLanguage } from '../context/LanguageContext.js';

function AnimatedCounter({ end, duration = 1500, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className="font-sans font-extrabold text-5xl text-yellow-400">{count}{suffix}</span>;
}

interface HomeProps {
  packages: Package[];
  featuredSongs: GallerySong[];
  featuredReviews: ClientReview[];
  onNavigate: (page: string, params?: any) => void;
}

export default function Home({ packages, featuredSongs, featuredReviews, onNavigate }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const { language, t } = useLanguage();
  
  const categories = [
    { 
      id: 'anniversaire', 
      name: language === 'fr' ? 'Anniversaire' : language === 'sw' ? 'Kumbukumbu ya Kuzaliwa' : 'Birthday', 
      icon: Sparkles, 
      desc: language === 'fr' 
        ? 'Une chanson pleine de souvenirs pour faire sourire et émouvoir.' 
        : language === 'sw'
        ? 'Wimbo uliojaa kumbukumbu za kuchekesha na kugusa hisia.'
        : 'A song packed with memories to make them smile and feel moved.'
    },
    { 
      id: 'mariage', 
      name: language === 'fr' ? 'Mariage' : language === 'sw' ? 'Arusi' : 'Wedding', 
      icon: Heart, 
      desc: language === 'fr' 
        ? 'Une chanson d’amour élégante pour célébrer votre histoire.' 
        : language === 'sw'
        ? 'Wimbo wa mapenzi wa kifahari kusherehekea hadithi yenu.'
        : 'An elegant love song to celebrate your beautiful story.'
    },
    { 
      id: 'deuil', 
      name: language === 'fr' ? 'Hommage / Deuil' : language === 'sw' ? 'Kumbukumbu ya Msiba' : 'Funeral Tribute', 
      icon: Award, 
      desc: language === 'fr' 
        ? 'Un hommage sincère, tendre et profondément humain.' 
        : language === 'sw'
        ? 'Kumbukumbu ya dhati, ya upole na yenye kugusa hisia.'
        : 'A sincere, tender, and deeply human memorial tribute.'
    },
    { 
      id: 'amour', 
      name: language === 'fr' ? 'Amour / Demande' : language === 'sw' ? 'Mapenzi / Kuposa' : 'Love / Proposal', 
      icon: Flame, 
      desc: language === 'fr' 
        ? 'Une déclaration inoubliable, plus forte qu’un simple cadeau.' 
        : language === 'sw'
        ? 'Tamko lisilosahaulika, lenye nguvu zaidi kuliko zawadi ya kawaida.'
        : 'An unforgettable declaration, more powerful than a simple gift.'
    },
    { 
      id: 'naissance', 
      name: language === 'fr' ? 'Naissance' : language === 'sw' ? 'Kuzaliwa kwa Mtoto' : 'Birth / Newborn', 
      icon: Baby, 
      desc: language === 'fr' 
        ? 'Un souvenir doux et précieux pour accueillir une nouvelle vie.' 
        : language === 'sw'
        ? 'Kumbukumbu tamu na ya thamani ya kukaribisha maisha mapya.'
        : 'A sweet and precious keepsake to welcome a new life.'
    },
    { 
      id: 'remerciement', 
      name: language === 'fr' ? 'Remerciement' : language === 'sw' ? 'Shukrani' : 'Thank You', 
      icon: HeartHandshake, 
      desc: language === 'fr' 
        ? 'Dire merci avec une chanson qui touche le cœur.' 
        : language === 'sw'
        ? 'Kusema asante kwa wimbo unaogusa moyo kabisa.'
        : 'Say thank you with a custom song that touches the heart.'
    },
    { 
      id: 'gospel', 
      name: language === 'fr' ? 'Gospel / Prière' : language === 'sw' ? 'Gospel / Sala' : 'Gospel / Prayer', 
      icon: Sun, 
      desc: language === 'fr' 
        ? 'Une chanson inspirée par la foi, l’espérance et la reconnaissance.' 
        : language === 'sw'
        ? 'Wimbo unaochochewa na imani, tumaini na shukrani.'
        : 'A custom song inspired by faith, hope, and gratitude.'
    }
  ];

  const testimonials = [
    {
      name: "Christian M.",
      event: language === 'fr' ? "Mariage à Kinshasa" : language === 'sw' ? "Arusi huko Kinshasa" : "Wedding in Kinshasa",
      rating: 5,
      comment: language === 'fr' 
        ? "Quand on a entendu nos prénoms dans la chanson, toute la salle s’est levée. Les gens avaient les larmes aux yeux, c'était d'une puissance rare." 
        : language === 'sw'
        ? "Wakati tuliposikia majina yetu kwenye wimbo, ukumbi mzima ulisimama. Watu walikuwa na machozi ya furaha, ilikuwa nguvu ya kipekee."
        : "When we heard our names in the song, the entire room stood up. People had tears in their eyes, it was an incredibly powerful moment."
    },
    {
      name: "Sarah K.",
      event: language === 'fr' ? "Anniversaire 60 ans" : language === 'sw' ? "Kumbukumbu ya Miaka 60" : "60th Birthday",
      rating: 5,
      comment: language === 'fr'
        ? "Mon père a fondu en larmes en écoutant les paroles sur son parcours. Il ne montre jamais ses émotions d'habitude. C’est le plus beau cadeau de sa vie."
        : language === 'sw'
        ? "Baba yangu alilia kwa furaha aliposikiliza maneno ya wimbo kuhusu maisha yake. Huwa haonyeshi hisia zake kwa kawaida. Hii ndio zawadi nzuri zaidi maishani mwake."
        : "My father melted into tears listening to the lyrics about his life journey. He never shows his emotions usually. This is the most beautiful gift of his life."
    },
    {
      name: "Inès B.",
      event: language === 'fr' ? "Naissance & Berceuse" : language === 'sw' ? "Kuzaliwa na Wimbo wa Mtoto" : "Baby Birth & Lullaby",
      rating: 5,
      comment: language === 'fr'
        ? "Je l’écoute tous les soirs avec ma fille pour l'endormir. C'est une berceuse magnifique qui raconte notre complicité, merci au studio !"
        : language === 'sw'
        ? "Ninaisikiliza kila usiku na binti yangu kumlaza. Ni wimbo mzuri wa kubembeleza unaosimulia uhusiano wetu, asante kwa studio!"
        : "I listen to it every night to put my daughter to sleep. It is a beautiful lullaby that tells the story of our close bond, thank you to the studio!"
    },
    {
      name: "Jean-Pierre T.",
      event: language === 'fr' ? "Hommage de deuil" : language === 'sw' ? "Kumbukumbu ya Msiba" : "Funeral Tribute",
      rating: 5,
      comment: language === 'fr'
        ? "Un hommage d'une dignité incroyable. Toute la famille a été profondément touchée par la justesse des mots et la beauté de la mélodie."
        : language === 'sw'
        ? "Kumbukumbu yenye heshima kubwa sana. Familia nzima iliguswa sana na usahihi wa maneno na uzuri wa sauti."
        : "An incredibly dignified tribute. The entire family was deeply touched by the precision of the words and the beauty of the melody."
    },
    {
      name: "Amani L.",
      event: language === 'fr' ? "Demande en Mariage" : language === 'sw' ? "Kuposa Uchumba" : "Marriage Proposal",
      rating: 5,
      comment: language === 'fr'
        ? "Elle a dit Oui en pleurant de joie ! La chanson racontait notre rencontre au bord du lac, c'était absolument magique."
        : language === 'sw'
        ? "Alisema Ndiyo akilia kwa furaha! Wimbo huo ulisimulia jinsi tulivyokutana kando ya ziwa, ulikuwa wa kichawi kabisa."
        : "She said Yes while crying with joy! The song narrated our meeting by the lake, it was absolutely magical."
    }
  ];

  const [testiIndex, setTestiIndex] = useState(0);

  const nextTesti = () => {
    setTestiIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTesti = () => {
    setTestiIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(nextTesti, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="voxmory-homepage" className="relative pb-20 sm:pb-0 bg-black text-white">
      
      {/* ------------------------------------
          1. HERO SECTION (Redessinée)
          ------------------------------------ */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-gradient-to-b from-[#060408] via-[#040206] to-black">
        
        {/* Background glowing lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(168,85,247,0.12)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(234,179,8,0.06)_0%,_transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left order-2 lg:order-1">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-mono text-xs tracking-wider uppercase animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t('tagline', 'hero')}</span>
            </div>

            <h1 className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
              {t('title_part1', 'hero')}{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                {t('title_grad', 'hero')}
              </span>{' '}
              {t('title_part2', 'hero')}
            </h1>

            <p className="text-gray-300 text-sm sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('desc', 'hero')}
            </p>

            {/* Preuves immédiates */}
            <div className="py-3 px-4 rounded-2xl bg-white/5 border border-white/10 inline-flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs text-gray-300 font-sans">
              <span className="flex items-center gap-1.5">
                {t('badge_speed', 'hero')}
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                {t('badge_human', 'hero')}
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                {t('badge_momo', 'hero')}
              </span>
            </div>

            {/* CTAs Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onNavigate('order')}
                className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-sans font-bold text-sm tracking-widest uppercase hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-yellow-500/15 cursor-pointer"
              >
                {t('btn_order', 'hero')}
              </button>

              <button
                onClick={() => onNavigate('gallery')}
                className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-sans font-semibold text-sm tracking-widest uppercase border border-white/10 hover:border-yellow-500/20 transition-all duration-300 cursor-pointer"
              >
                {t('btn_examples', 'hero')}
              </button>
            </div>

            {/* Microcopie de réassurance */}
            <p className="text-xs text-gray-400 italic">
              {t('microcopy', 'hero')}
            </p>

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-sm">
              <span className="text-gray-500 text-xs">{t('or_whatsapp', 'hero')}</span>
              <a
                href="https://wa.me/243978508099"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-all font-semibold text-xs"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0 fill-green-400/20 text-green-400 animate-pulse" />
                <span>{t('whatsapp_cta', 'nav')} : <strong className="whitespace-nowrap font-mono text-sm">+243 978 508 099</strong></span>
              </a>
            </div>

          </div>

          {/* Hero Right Visual Column (Premium Album Layout with ZERO overlapping) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center lg:justify-end w-full space-y-4 order-1 lg:order-2" id="hero-right-visual">
            
            {/* Elegant Album Cover with Thin Animated Border (100% clean, no overlaps) */}
            <div className="relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[400px] aspect-square rounded-2xl overflow-hidden p-[1.5px] animated-border-glow shadow-2xl shadow-purple-500/20">
              <div className="w-full h-full rounded-2xl bg-[#09090c] overflow-hidden relative group">
                {!imageError ? (
                  <img
                    src="/images/1783329105667-80e71f71-35ca-4c27-a1c0-4ec31ca0c188-1_all_5872.jpg"
                    alt="Affiche du Single Trahison - VOXMORY Studio"
                    className="w-full h-full object-cover opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#0f0914] via-[#1a0f2b] to-[#0a0512] flex flex-col items-center justify-center p-6 text-center select-none relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(234,179,8,0.08)_0%,_transparent_60%)] pointer-events-none" />
                    
                    {/* Spinning Vinyl Disk */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl border-4 border-zinc-950 relative animate-spin-slow">
                      <div className="absolute inset-2 rounded-full border border-zinc-800/40" />
                      <div className="absolute inset-6 rounded-full border border-zinc-800/60" />
                      <div className="absolute inset-10 rounded-full border border-zinc-700" />
                      {/* Gold record center */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center shadow-inner">
                        <Music className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    
                    {/* Cover Text */}
                    <div className="mt-6 space-y-1 z-10">
                      <span className="block text-[10px] text-yellow-500 font-bold tracking-[0.25em] uppercase font-mono">VOXMORY STUDIO</span>
                      <h3 className="text-lg font-extrabold text-white tracking-wide leading-tight">« TRAHISON »</h3>
                      <p className="text-xs text-pink-400 font-medium">Single Vedette • Rumba Congolaise</p>
                    </div>
                  </div>
                )}
                
                {/* Visual light reflection sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              </div>
            </div>

            {/* Separate, Modern Spotify-style Player Bar (Underneath the cover, zero overlapping!) */}
            <div className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[400px]">
              <AudioPlayer
                audioUrl="/audio/1783329292940-NO_LLA_kabala_.mp3"
                title="« TRAHISON »"
                subtitle="Single Vedette • Rumba Congolaise"
                startTime={0}
                endTime={45} // 45 seconds teaser for home page preview
              />
            </div>
            
          </div>

        </div>
      </section>

      {/* ------------------------------------
          2. BANDEAU DE RÉASSURANCE
          ------------------------------------ */}
      <section className="py-10 bg-[#07070b] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h4 className="font-sans font-extrabold text-sm uppercase tracking-widest text-yellow-400">
              Pourquoi les familles nous choisissent
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">💡</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Vous n’avez pas besoin de savoir écrire.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">✨</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Nous transformons vos souvenirs en paroles fortes.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">❤️</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Chaque chanson est pensée pour une personne réelle et un moment vrai.
              </p>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-yellow-400 font-bold text-lg">🎁</span>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Vous recevez un souvenir unique, intime et impossible à remplacer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------
          3. SECTION RECONNAISSANCE IMMÉDIATE (Cas d'usage - Version Premium Compacte)
          ------------------------------------ */}
      <section className="py-12 sm:py-16 bg-[#030304] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-2 mb-8 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-[10px] sm:text-xs tracking-widest uppercase">
              Pour quel moment de vie souhaitez-vous créer une chanson ?
            </h2>
            <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white">
              Sélectionnez votre occasion et commencez
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('order', { category: cat.name })}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#0c0c12] border border-white/5 hover:border-yellow-400/30 hover:bg-[#12121a] transition-all duration-300 cursor-pointer shadow-md hover:shadow-yellow-500/5 select-none"
                  id={`cat-card-${cat.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:from-purple-500/15 group-hover:to-pink-500/15 group-hover:text-pink-400 group-hover:border-pink-500/30 transition-all duration-300">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="font-sans font-extrabold text-xs sm:text-sm text-white group-hover:text-yellow-400 transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors truncate max-w-[220px] sm:max-w-none mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-gray-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}

            {/* Special quick CTA block at the end of categories list to keep total count balanced and guide to conversion */}
            <div
              onClick={() => onNavigate('order')}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/30 hover:border-yellow-400 hover:from-yellow-400/20 hover:to-amber-500/20 transition-all duration-300 cursor-pointer shadow-md select-none"
              id="cat-card-custom"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-300">
                  <Music className="w-5 h-5 fill-black/10" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="font-sans font-black text-xs sm:text-sm text-yellow-400 group-hover:text-yellow-300 transition-colors truncate">
                    Autre Événement
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-300 group-hover:text-white transition-colors truncate mt-0.5">
                    Créer un projet sur-mesure de A à Z.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2 text-yellow-400 group-hover:translate-x-1 transition-all duration-300">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('order')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              id="btn-categories-generic-cta"
            >
              Lancer ma création personnalisée
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          4. SECTION ÉCOUTE (Audio Portfolio)
          ------------------------------------ */}
      <section className="py-20 bg-[#050507]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
                Écoutez ce que peut devenir une simple histoire
              </h2>
              <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white">
                Quelques phrases, un souvenir… et cela devient une chanson de studio
              </p>
              <p className="text-gray-400 max-w-xl text-xs sm:text-sm">
                Chaque extrait audio a été entièrement conçu à partir d'une histoire vraie confiée par un client.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('gallery')}
              className="text-yellow-400 hover:text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer border-b border-yellow-400/20 pb-1"
            >
              <span>Écouter plus d'exemples</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredSongs.slice(0, 3).map((song) => (
              <div
                key={song.id}
                className="bg-[#0c0c10] border border-yellow-500/10 rounded-3xl p-6 space-y-6 hover:border-purple-500/25 transition-all duration-300 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 items-center">
                      <span className="px-3 py-1 rounded-full bg-purple-950 text-pink-400 font-sans font-semibold text-[10px] uppercase tracking-wider">
                        {song.occasion}
                      </span>
                      {song.isFeatured && (
                        <span className="px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 font-sans font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 border border-yellow-400/20">
                          ✨ Vedette
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{song.style}</span>
                  </div>

                  <AudioPlayer
                    audioUrl={song.audioUrl}
                    title={song.title}
                    subtitle={`${song.language} • ${song.mood}`}
                    coverUrl={song.coverUrl}
                    startTime={song.startTime}
                    endTime={song.endTime}
                  />

                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    "{song.description}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => onNavigate('order', { songTemplate: song.title, category: song.occasion, style: song.style, mood: song.mood })}
                    className="w-full py-3 bg-white/5 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white text-white font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    Commander une chanson similaire
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------
          5. COMMENT ÇA MARCHE (Éléments du process)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Processus Ultra Simple
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              Comment ça marche ?
            </p>
            <p className="text-gray-400 text-sm">
              Aucune compétence technique nécessaire. Nous gérons absolument tout de A à Z.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">1. Vous nous racontez votre histoire</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Par texte, audio ou WhatsApp. Même quelques phrases simples ou une note vocale rapide suffisent largement pour nous donner le contexte.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Music className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">2. Nous écrivons et composons</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nos auteurs et créatifs transforment vos mots et anecdotes en paroles soignées, rimes émouvantes et mélodies de haute qualité studio.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0e0e12] border border-yellow-500/5 p-8 rounded-3xl space-y-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-lg text-white">3. Vous validez, puis nous livrons</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Vous recevez votre chanson dans le format prévu, prête à offrir, à partager ou à faire jouer lors de votre événement ou célébration familiale.
              </p>
            </div>

          </div>

          <div className="mt-12 inline-block px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs text-yellow-400 font-sans font-semibold">
            Simple • Rapide • Humain • Sans compétence technique
          </div>

        </div>
      </section>

      {/* ------------------------------------
          6. SECTION BÉNÉFICES (Ce que vous offrez vraiment)
          ------------------------------------ */}
      <section className="py-20 bg-gradient-to-b from-[#030304] to-[#0a0a0f] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
            Ce que vous offrez vraiment
          </h2>
          
          <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white leading-tight">
            Vous n’offrez pas juste une musique.<br />
            <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
              Vous offrez un souvenir vivant, une preuve d’amour, un hommage qu’on n’oublie pas.
            </span>
          </p>

          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🔥</span>
              <p className="text-xs text-gray-300 leading-relaxed">Un moment magique qui bouleverse toute une salle d'invités.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🎵</span>
              <p className="text-xs text-gray-300 leading-relaxed">Une trace intemporelle que la personne pourra réécouter toute sa vie.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">💖</span>
              <p className="text-xs text-gray-300 leading-relaxed">Un niveau d'attention émotionnelle mille fois supérieur à un cadeau classique.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
              <span className="text-xl text-yellow-400">🌟</span>
              <p className="text-xs text-gray-300 leading-relaxed">Une création artisanale valorisant la culture et la sincérité.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          7. SECTION OFFRES (Tarifs clairs)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Choisissez la formule qui correspond à votre émotion
            </h2>
            <p className="font-sans font-extrabold text-3xl sm:text-4xl text-white">
              Des tarifs transparents pour immortaliser vos vœux
            </p>
            <p className="text-gray-400 text-sm">
              Sélectionnez l'ampleur de votre surprise ci-dessous. Paiements sécurisés simplifiés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-[#0e0e12] border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  pkg.id === 'pack_musique_video'
                    ? 'border-yellow-400 ring-1 ring-yellow-400/30 relative scale-[1.03] shadow-lg shadow-yellow-950/15'
                    : 'border-yellow-500/10 hover:border-purple-500/20'
                }`}
              >
                {pkg.id === 'pack_musique_video' && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    La Plus Populaire
                  </span>
                )}

                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-lg text-white">{pkg.name}</h3>
                    <p className="text-xs text-gray-400 min-h-[32px]">{pkg.promise}</p>
                  </div>

                  <div className="border-y border-white/5 py-4 space-y-1">
                    <span className="block font-sans text-xs text-gray-400">À partir de :</span>
                    <span className="block font-sans font-extrabold text-3xl text-yellow-400">{pkg.priceLabel}</span>
                    <span className="block text-xs text-pink-400 font-medium">Livraison : {pkg.deliveryTime}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {pkg.includes.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => onNavigate('order', { packageId: pkg.id })}
                    className={`w-full py-3.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer text-center ${
                      pkg.id === 'pack_musique_video'
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:scale-[1.02]'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Choisir cette formule
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------
          8. SECTION DIFFÉRENCIATION (Pourquoi nous)
          ------------------------------------ */}
      <section className="py-20 bg-[#050507]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              Pourquoi VOXMORY est différent
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              Une exigence artistique, un coeur humain
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Nous partons de votre vraie histoire</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Pas d’émotion générique ou de phrases pré-écrites industrielles. Chaque couplet, chaque rime est lié directement aux prénoms, anecdotes et mémoires confiés par vos soins.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Il y a une validation et une relecture humaine</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Les mots comptent. Nos paroliers relisent, ajustent, corrigent la prosodie et s'assurent que la diction artistique respecte parfaitement les conventions d'expression.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Vous pouvez commander sans savoir écrire</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Pas besoin d'avoir fait de grandes études littéraires ou musicales. Une simple note vocale ou quelques lignes spontanées nous suffisent pour en faire un bijou d'émotions.
              </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <h4 className="font-sans font-bold text-white text-base">Le rendu est 100% prêt à offrir</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                L'audio est produit en qualité studio, et selon votre pack, nous fournissons la vidéo personnalisée et une page souvenir privée interactive accessible via un QR code imprimable.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          9. SECTION PREUVE SOCIALE (Témoignages forts - Premium Carousel)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto space-y-3 mb-16 text-center">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              {t('sub', 'testimonials')}
            </h2>
            <p className="font-sans font-extrabold text-2xl sm:text-3xl text-white">
              {t('title', 'testimonials')}
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto px-4 sm:px-0">
            {/* Ambient background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-70 -z-10" />
            
            <div className="relative bg-gradient-to-b from-[#0f0f15]/95 to-[#07070b]/98 border border-yellow-500/10 hover:border-yellow-400/30 p-8 sm:p-12 rounded-3xl space-y-6 shadow-2xl transition-all duration-300">
              {/* Gold Stars */}
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                ))}
              </div>
              
              {/* Quotation mark */}
              <span className="block text-center text-4xl text-purple-400/40 font-serif font-extrabold leading-none">“</span>
              
              {/* Review Text */}
              <p className="text-center text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed italic font-medium min-h-[90px] flex items-center justify-center">
                {testimonials[testiIndex].comment}
              </p>
              
              {/* Client detail */}
              <div className="text-center pt-4 border-t border-white/5">
                <span className="block font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-sans">
                  {testimonials[testiIndex].name}
                </span>
                <span className="text-[10px] sm:text-xs text-pink-400">
                  {testimonials[testiIndex].event}
                </span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-16 z-10">
              <button
                onClick={prevTesti}
                className="w-10 h-10 rounded-full bg-[#121216]/90 hover:bg-[#181820] border border-white/10 hover:border-yellow-400/30 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-16 z-10">
              <button
                onClick={nextTesti}
                className="w-10 h-10 rounded-full bg-[#121216]/90 hover:bg-[#181820] border border-white/10 hover:border-yellow-400/30 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 pt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestiIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${testiIndex === idx ? 'bg-yellow-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('reviews')}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:border-yellow-500/20 rounded-full font-sans font-bold text-xs uppercase tracking-widest text-white transition-all cursor-pointer"
            >
              {t('btn_more', 'testimonials')}
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------
          10. SECTION RÉASSURANCE (Tranquillité)
          ------------------------------------ */}
      <section className="py-16 bg-[#060609] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="font-sans font-bold text-xl text-white">{t('title', 'tranquility')}</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t('desc', 'tranquility')}
          </p>
          <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-2xl max-w-xl mx-auto inline-flex items-center gap-2 text-yellow-400 font-sans text-xs">
            <span className="text-lg">🛡️</span>
            <span>{t('guarantee', 'tranquility')}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------
          11. FAQ CONVERSION (Accordéon des objections)
          ------------------------------------ */}
      <section className="py-20 bg-[#030304]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="font-sans font-bold text-yellow-400 text-xs tracking-widest uppercase">
              {t('sub', 'faq')}
            </h2>
            <p className="font-sans font-extrabold text-3xl text-white">
              {t('title', 'faq')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: t('objection_price_q', 'faq'),
                a: t('objection_price_a', 'faq')
              },
              {
                q: t('objection_delivery_q', 'faq'),
                a: t('objection_delivery_a', 'faq')
              },
              {
                q: t('objection_momo_q', 'faq'),
                a: t('objection_momo_a', 'faq')
              },
              {
                q: t('objection_audio_q', 'faq'),
                a: t('objection_audio_a', 'faq')
              },
              {
                q: t('objection_edit_q', 'faq'),
                a: t('objection_edit_a', 'faq')
              },
              {
                q: t('objection_whatsapp_q', 'faq'),
                a: t('objection_whatsapp_a', 'faq')
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#0e0e12] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-yellow-500/20"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-6 flex justify-between items-center text-white font-sans font-bold text-sm sm:text-base cursor-pointer focus:outline-none"
                >
                  <span className="pr-4">{idx + 1}. {faq.q}</span>
                  <span className={`text-yellow-400 text-xl transition-transform duration-300 ${activeFaq === idx ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeFaq === idx ? 'max-h-96 border-t border-white/5' : 'max-h-0'
                  }`}
                >
                  <p className="p-6 text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#0b0a0f]">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------
          12. FINAL CTA SECTION (Closing)
          ------------------------------------ */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-t from-[#060408] to-black">
        
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(147,51,234,0.14)_0%,_transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 space-y-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <Music className="w-6 h-6" />
          </div>

          <div className="space-y-4">
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Ne laissez pas vos souvenirs rester dans votre tête.<br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Transformez-les en chanson.
              </span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Racontez votre histoire aujourd’hui, et offrez à quelqu’un un moment d’émotion pure qu’il n’oubliera jamais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('order')}
              className="w-full sm:w-auto px-10 py-4.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-sans font-bold text-sm tracking-widest uppercase hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-yellow-500/10"
            >
              Commander ma chanson maintenant
            </button>
            
            <a
              href="https://wa.me/243978508099"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 rounded-full bg-[#121216] border border-white/10 hover:border-green-500/30 text-green-400 font-sans font-bold text-sm tracking-widest uppercase transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-green-400/10" />
              Parler à VOXMORY sur WhatsApp
            </a>
          </div>

          <div className="text-[11px] text-gray-500 font-mono">
            Réponse rapide • Paiement simple • Accompagnement humain
          </div>
        </div>
      </section>

      {/* ------------------------------------
          STICKY CTA MOBILE FLOTTANT
          ------------------------------------ */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs">
        <button
          onClick={() => onNavigate('order')}
          className="w-full py-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 border border-yellow-300"
        >
          <Sparkles className="w-4 h-4 fill-black text-black" />
          <span>Commander ma chanson</span>
        </button>
      </div>

    </div>
  );
}
