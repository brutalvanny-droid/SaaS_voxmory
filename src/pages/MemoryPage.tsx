import { useState, useEffect } from 'react';
import { Sparkles, Heart, Share2, Music, Award, ArrowRight } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer.js';
import { MemoryPage } from '../types.js';

interface MemoryPageProps {
  slug?: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function MemoryPageComp({ slug = 'maman-georgette', onNavigate }: MemoryPageProps) {
  const [pageData, setPageData] = useState<MemoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPhotoError(false);
    // Fetch details
    fetch(`/api/memory-pages/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setPageData(data);
        setError(false);
      })
      .catch(err => {
        console.error('Error fetching memory page', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const getShareText = () => {
    return `❤️ Écoute cette chanson personnalisée magnifique « ${pageData?.songTitle || pageData?.eventTitle || 'Chanson'} », créée spécialement pour ${pageData?.recipientName} ! Découvre les paroles et la dédicace ici : ${window.location.origin}/#memory/${slug}`;
  };

  const shareWhatsApp = () => {
    const text = getShareText();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const shareFacebook = () => {
    const shareUrl = `${window.location.origin}/#memory/${slug}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank');
  };

  const shareTwitter = () => {
    const text = getShareText();
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twUrl, '_blank');
  };

  const copyLink = () => {
    const shareUrl = `${window.location.origin}/#memory/${slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-white bg-black space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400 font-mono">Chargement de votre souvenir éternel...</p>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-white bg-black p-4 text-center space-y-6">
        <Heart className="w-16 h-16 text-pink-500/30 animate-pulse" />
        <div className="space-y-2">
          <h2 className="font-sans font-extrabold text-2xl">Page souvenir introuvable</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">Le lien de partage est incorrect ou la page a expiré. Contactez notre support technique pour la réactiver.</p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest cursor-pointer"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  const effectivePhotoUrl = pageData.photoUrl || pageData.recipientPhotoUrl || pageData.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="min-h-[90vh] py-16 bg-[#030304] text-white relative overflow-hidden">
      
      {/* Absolute background visual glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(168,85,247,0.12)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,_rgba(234,179,8,0.06)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        
        {/* Memory Header block */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/20 text-yellow-400 font-mono text-xs uppercase tracking-wider animate-pulse">
            <Heart className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>Page Souvenir Sacrée</span>
          </div>
          
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Chanson dédiée à <br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              {pageData.recipientName}
            </span>
          </h1>
          <p className="text-pink-400 font-medium text-sm tracking-wide">
            Offerte par {pageData.senderName || 'un proche'} • À l'occasion de : {pageData.occasion || 'Souvenir'}
          </p>
        </div>

        {/* Recipient Photo / Main Visual Banner Card */}
        <div className="relative max-w-md mx-auto aspect-[4/3] rounded-3xl overflow-hidden p-[1px] bg-gradient-to-b from-purple-500/30 to-yellow-500/20 shadow-2xl">
          <div className="w-full h-full rounded-3xl bg-black relative overflow-hidden">
            <img
              src={photoError ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" : effectivePhotoUrl}
              alt={pageData.recipientName}
              className="w-full h-full object-cover opacity-80"
              onError={() => setPhotoError(true)}
            />
            {/* Audio Wave layout overlays */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6 pt-24 z-10">
              <span className="text-[10px] uppercase font-mono text-gray-400 tracking-widest block mb-1">Mélodie Émotionnelle</span>
              <h3 className="font-sans font-bold text-lg text-white">« {pageData.songTitle || pageData.eventTitle || 'Chanson Souvenir'} »</h3>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="max-w-2xl mx-auto space-y-6">
          <AudioPlayer
            audioUrl={pageData.audioUrl}
            title={pageData.songTitle || pageData.eventTitle || 'Chanson Souvenir'}
            subtitle={`Lien Souvenir • ${pageData.occasion || 'Cadeau'}`}
            coverUrl={photoError ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" : effectivePhotoUrl}
          />
          
          {/* Social Sharing Component */}
          <div className="bg-[#0e0e12]/90 border border-white/5 p-6 rounded-3xl space-y-4 text-center relative overflow-hidden shadow-xl shadow-black/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_rgba(168,85,247,0.08)_0%,_transparent_70%)] pointer-events-none" />
            
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm text-white flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4 text-yellow-400" />
                <span>Partager ce souvenir précieux</span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Diffusez l'émotion de cette chanson personnalisée avec votre famille et vos proches.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/50 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.454L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.115-2.887-6.979C16.578 1.898 14.1 1.874 11.465 1.874a9.854 9.854 0 0 0-9.856 9.86c-.001 1.716.452 3.39 1.31 4.871L1.89 22.106l5.757-1.512H7.64z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-sans font-bold text-gray-300 group-hover:text-white mt-2">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/50 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-sans font-bold text-gray-300 group-hover:text-white mt-2">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={shareTwitter}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 hover:border-gray-500/50 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gray-500/20 flex items-center justify-center text-white group-hover:scale-110 transition-all duration-300">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-sans font-bold text-gray-300 group-hover:text-white mt-2">X / Twitter</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all group cursor-pointer ${
                  copied
                    ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/50 text-purple-400'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${copied ? 'bg-yellow-500/30' : 'bg-purple-500/20'}`}>
                  {copied ? (
                    <svg className="w-5 h-5 text-yellow-400 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] font-sans font-bold text-gray-300 group-hover:text-white mt-2">
                  {copied ? 'Copié !' : 'Copier le lien'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Paroles & Dédicace Split Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Paroles (Lyrics) */}
          <div className="bg-[#0e0e12] border border-yellow-500/10 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="font-sans font-extrabold text-xl text-yellow-400 flex items-center gap-2 border-b border-white/5 pb-3">
              <Music className="w-5 h-5 text-yellow-400" />
              <span>Les Paroles</span>
            </h3>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono tracking-wide h-[350px] overflow-y-auto pr-2">
              {pageData.lyrics}
            </div>
          </div>

          {/* Dédicace / Message */}
          <div className="bg-gradient-to-tr from-[#120a16] to-[#0c0c10] border border-pink-500/10 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="font-sans font-extrabold text-xl text-pink-400 flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="w-5 h-5 text-pink-400" />
              <span>La Dédicace</span>
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed italic">
                "{pageData.personalMessage}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-pink-950 flex items-center justify-center border border-pink-500/20 text-pink-400 text-sm font-bold">
                  {(pageData.senderName || "Un proche")[0]}
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">{pageData.senderName || "Un proche"}</span>
                  <span className="block text-[10px] text-gray-500 font-mono">Dédicataire de l'œuvre</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Shared Bottom CTA Banner */}
        <div className="bg-[#0e0e12] border border-yellow-500/15 p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-black flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-sans font-extrabold text-2xl text-white">
              Vous aussi, offrez un cadeau magique à ceux que vous aimez !
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              Ne laissez pas vos plus précieux souvenirs s'envoler. Créez une chanson unique pour un anniversaire, mariage ou hommage.
            </p>
          </div>
          <button
            onClick={() => onNavigate('order')}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 mx-auto cursor-pointer hover:scale-[1.02] transition-all"
          >
            <span>Créer une chanson pour un proche</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
