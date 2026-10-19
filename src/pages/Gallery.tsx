import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Search, Sparkles, Filter, Music, Lock, Unlock, Pencil, Trash2, X, Upload, Eye, EyeOff, Check, AlertCircle, Share2, MessageCircle } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer.js';
import { api } from '../lib/api.js';
import { GallerySong } from '../types.js';
import Reveal from '../components/Reveal.js';

interface GalleryProps {
  initialSongs: GallerySong[];
  onNavigate: (page: string, params?: any) => void;
}

export default function Gallery({ initialSongs, onNavigate }: GalleryProps) {
  const [songs, setSongs] = useState<GallerySong[]>(initialSongs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Administrative Lock and Modal States
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  // Deletion States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Editing Modal States
  const [editingSong, setEditingSong] = useState<GallerySong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOccasion, setEditOccasion] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClientReaction, setEditClientReaction] = useState('');
  const [editVisibility, setEditVisibility] = useState<'Private' | 'Public with first name' | 'Public anonymous' | 'Demo only'>('Public anonymous');
  const [editClientFirstName, setEditClientFirstName] = useState('');
  const [editMemorySlug, setEditMemorySlug] = useState('');
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);

  // Upload States
  const [isUploadingEditAudio, setIsUploadingEditAudio] = useState(false);
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const occasions = ['all', 'Anniversaire', 'Mariage', 'Hommage / Deuil', 'Déclaration d\'amour', 'Collation / Diplôme', 'Naissance'];
  const styles = ['all', 'Rumba congolaise', 'Afrobeat', 'Acoustique émotionnel', 'Gospel', 'Zouk'];

  // Safe alert helper that won't crash in sandboxed iframes
  const triggerNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Check auth on mount & load latest songs
  useEffect(() => {
    if (localStorage.getItem('voxmory_gallery_admin_unlocked') === 'true') {
      setIsAdminUnlocked(true);
    }
    fetchSongs();
  }, [isAdminUnlocked]); // Refetch when admin status changes so admins can see Private songs as well

  const fetchSongs = () => {
    setIsLoading(true);
    // Admins need to see all songs including private ones, while public sees only non-private
    const endpoint = isAdminUnlocked ? '/api/admin/gallery' : '/api/gallery';
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSongs(data);
        }
      })
      .catch(err => console.error('Error fetching gallery songs', err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  // L'édition n'est possible que si le serveur confirme une session valide.
  // Aucun mot de passe n'est stocké côté navigateur : c'est l'API qui décide.
  useEffect(() => {
    api
      .me()
      .then(() => setIsAdminUnlocked(true))
      .catch(() => setIsAdminUnlocked(false));
  }, []);

  const handleOpenUnlockModal = () => {
    setShowUnlockModal(true);
  };

  const handleUnlockAdmin = (e: FormEvent) => {
    e.preventDefault();
    setShowUnlockModal(false);
    onNavigate('admin');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    triggerNotification('success', 'Mode administration verrouillé.');
  };

  // Direct Audio & Cover File Uploads for Editing
  const handleAudioFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditAudio(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setEditAudioUrl(data.url);
          triggerNotification('success', 'Fichier audio téléversé avec succès !');
        } else {
          triggerNotification('error', 'Erreur lors du téléversement du fichier.');
        }
      } catch (err) {
        console.error('Upload error', err);
        triggerNotification('error', 'Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingEditAudio(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditCover(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data
          })
        });

        if (response.ok) {
          const data = await response.json();
          setEditCoverUrl(data.url);
          triggerNotification('success', 'Pochette d\'album téléversée avec succès !');
        } else {
          triggerNotification('error', 'Erreur lors du téléversement de l’image.');
        }
      } catch (err) {
        console.error('Upload error', err);
        triggerNotification('error', 'Erreur de connexion lors du téléversement.');
      } finally {
        setIsUploadingEditCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getMemoryLink = (song: GallerySong) => {
    // If a custom memorySlug is specified, use that.
    // Otherwise, try to find a clean format. We fallback to memory/ID
    const slug = song.memorySlug || song.id;
    return `${window.location.origin}/#memory/${slug}`;
  };

  const handleShareWhatsApp = (song: GallerySong) => {
    const memoryLink = getMemoryLink(song);
    const message = `❤️ Écoute cette magnifique chanson personnalisée « ${song.title} », créée par VOXMORY ! Un souvenir éternel en musique à découvrir ici : ${memoryLink}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyLink = (song: GallerySong) => {
    const memoryLink = getMemoryLink(song);
    navigator.clipboard.writeText(memoryLink).then(() => {
      setCopiedSongId(song.id);
      setTimeout(() => setCopiedSongId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  // Editing Trigger & Save
  const handleStartEdit = (song: GallerySong) => {
    setEditingSong(song);
    setEditTitle(song.title || '');
    setEditOccasion(song.occasion || 'Anniversaire');
    setEditStyle(song.style || 'Rumba congolaise');
    setEditLanguage(song.language || 'Lingala');
    setEditMood(song.mood || 'Chaleureux');
    setEditAudioUrl(song.audioUrl || '');
    setEditCoverUrl(song.coverUrl || '');
    setEditStartTime(song.startTime !== undefined ? String(song.startTime) : '');
    setEditEndTime(song.endTime !== undefined ? String(song.endTime) : '');
    setEditDescription(song.description || '');
    setEditClientReaction(song.clientReaction || '');
    setEditVisibility(song.visibility || 'Public anonymous');
    setEditClientFirstName(song.clientFirstName || '');
    setEditMemorySlug(song.memorySlug || '');
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    if (!editTitle || !editAudioUrl) {
      triggerNotification('error', 'Le titre et l\'URL audio sont requis.');
      return;
    }

    try {
      const payload = {
        title: editTitle,
        occasion: editOccasion,
        style: editStyle,
        language: editLanguage,
        mood: editMood,
        description: editDescription,
        audioUrl: editAudioUrl,
        coverUrl: editCoverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
        clientReaction: editClientReaction,
        visibility: editVisibility,
        clientFirstName: editClientFirstName,
        startTime: editStartTime ? parseFloat(editStartTime) : undefined,
        endTime: editEndTime ? parseFloat(editEndTime) : undefined,
        memorySlug: editMemorySlug || undefined
      };

      const response = await fetch(`/api/gallery/${editingSong.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        triggerNotification('success', 'Chanson de la galerie mise à jour avec succès !');
        setEditingSong(null);
        fetchSongs(); // Refresh full state
      } else {
        const errData = await response.json();
        triggerNotification('error', `Erreur : ${errData.error || 'Impossible de mettre à jour la chanson.'}`);
      }
    } catch (err) {
      console.error('Error saving gallery song edit', err);
      triggerNotification('error', 'Une erreur réseau est survenue lors de l\'enregistrement.');
    }
  };

  // Deletion Flow
  const handleDeleteGallerySong = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        triggerNotification('success', 'Chanson supprimée de la galerie !');
        setConfirmDeleteId(null);
        setSongs(prev => prev.filter(s => s.id !== id));
      } else {
        triggerNotification('error', 'Erreur serveur lors de la suppression de la chanson.');
      }
    } catch (err) {
      console.error('Error deleting gallery song', err);
      triggerNotification('error', 'Une erreur réseau est survenue lors de la suppression.');
    }
  };

  const filteredSongs = songs.filter(song => {
    const songTitle = song.title || '';
    const songDesc = song.description || '';
    const songOccasion = song.occasion || '';
    const songStyle = song.style || '';

    const matchesSearch = songTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          songDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          songOccasion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOccasion = selectedOccasion === 'all' || songOccasion === selectedOccasion;
    
    // Style matches substring
    const matchesStyle = selectedStyle === 'all' || songStyle.toLowerCase().includes(selectedStyle.toLowerCase());

    return matchesSearch && matchesOccasion && matchesStyle;
  });

  return (
    <div className="min-h-[85vh] py-16 bg-[#040206] text-white relative">
      
      {/* Dynamic Toast feedback */}
      {feedbackMessage && (
        <div className={`fixed bottom-6 right-6 z-[120] flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold shadow-2xl animate-fade-in ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          {feedbackMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(circle,_rgba(163,255,18,0.15)_0%,_transparent_70%)] pointer-events-none" />

      {/* Admin Toggle Button (Float/Header) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        {isAdminUnlocked ? (
          <button
            onClick={handleLockAdmin}
            className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-red-950/20"
            title="Verrouiller le mode administration de la galerie"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Mode Studio Actif</span>
          </button>
        ) : (
          <button
            onClick={handleOpenUnlockModal}
            className="p-2.5 bg-[#0B0D10]/60 hover:bg-[#0B0D10] text-[#8A949F] hover:text-[#A3FF12] rounded-xl transition-all border border-white/5 flex items-center gap-1.5 cursor-pointer shadow-md"
            title="S'authentifier pour éditer/supprimer les chansons"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        
        {/* Header section */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#A3FF12]/20 bg-[#A3FF12]/[0.05] text-[#A3FF12] font-mono text-[11px] uppercase tracking-[0.16em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Galerie d'émotions</span>
            </div>
            <h1 className="text-[clamp(2.1rem,5.6vw,3.75rem)] font-extrabold text-white tracking-[-0.04em] leading-[1.02]">
              Écoutez les chansons qui ont déjà <span className="text-gradient">touché des cœurs</span>
            </h1>
            <p className="text-[#A2ABB5] text-[15px] sm:text-base leading-relaxed">
              Chaque chanson part d’une vraie histoire : une maman, un couple, une famille, un souvenir, une personne qu’on aime.
            </p>
          </div>
        </Reveal>

        {/* Admin mode active indicator banner */}
        {isAdminUnlocked && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-xl">🔧</span>
              <div className="text-xs">
                <p className="text-white font-bold font-sans">Console de Modification Directe Active</p>
                <p className="text-[#A2ABB5] mt-0.5">Vous pouvez modifier les fiches de chansons (titres, images, audios) ou supprimer des productions.</p>
              </div>
            </div>
            <button
              onClick={handleLockAdmin}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            >
              Verrouiller la console
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="bg-[#0B0D10] border border-[#A3FF12]/10 p-6 rounded-3xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A949F]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher une chanson, un prénom, une histoire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white focus:border-[#A3FF12] focus:outline-none text-sm transition-all"
              />
            </div>

            {/* Occasion Selector */}
            <div className="md:col-span-3 relative">
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#A3FF12] focus:outline-none text-sm transition-all appearance-none cursor-pointer"
              >
                {occasions.map(occ => (
                  <option key={occ} value={occ}>
                    {occ === 'all' ? 'Toutes les occasions' : occ}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A949F] pointer-events-none text-xs font-mono">▼</span>
            </div>

            {/* Music Style Selector */}
            <div className="md:col-span-3 relative">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#A3FF12] focus:outline-none text-sm transition-all appearance-none cursor-pointer"
              >
                {styles.map(st => (
                  <option key={st} value={st}>
                    {st === 'all' ? 'Tous les rythmes' : st}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A949F] pointer-events-none text-xs font-mono">▼</span>
            </div>

          </div>
        </div>

        {/* List of songs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skeleton-gallery-${idx}`}
                className="bg-[#0B0D10] border border-[#A3FF12]/10 rounded-3xl p-6 space-y-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-[#0B0D10]/80 rounded-full"></div>
                    <div className="h-4 w-16 bg-white/5 rounded"></div>
                  </div>

                  <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex-shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full"></div>
                    <div className="h-3 bg-white/5 rounded w-5/6"></div>
                    <div className="h-3 bg-white/5 rounded w-4/6"></div>
                  </div>

                  <div className="p-3 bg-[#0B0D10]/10 rounded-xl border border-[#A3FF12]/5 space-y-2">
                    <div className="h-2 bg-[#A3FF12]/10 rounded w-1/4"></div>
                    <div className="h-3 bg-[#A3FF12]/5 rounded w-11/12"></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="h-11 bg-white/5 rounded-xl w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className={`bg-[#0B0D10] border rounded-3xl p-6 space-y-6 transition-all duration-300 flex flex-col justify-between relative group ${
                  isAdminUnlocked ? 'border-red-500/10 hover:border-red-500/30' : 'border-[#A3FF12]/10 hover:border-[#A3FF12]/20'
                }`}
              >
                {/* ADMIN CARD OVERLAYS FOR EDIT/DELETE */}
                {isAdminUnlocked && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 animate-fade-in">
                    <button
                      onClick={() => handleStartEdit(song)}
                      className="p-2 bg-black/80 hover:bg-[#A3FF12] text-[#A2ABB5] hover:text-black rounded-xl transition-all cursor-pointer border border-white/5 hover:border-transparent"
                      title="Modifier les informations"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {confirmDeleteId === song.id ? (
                      <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/30 p-1 rounded-xl animate-fade-in">
                        <span className="text-[9px] text-red-400 font-bold px-1.5 uppercase font-mono">Retirer ?</span>
                        <button
                          onClick={() => handleDeleteGallerySong(song.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[#C3CAD2] text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(song.id)}
                        className="p-2 bg-black/80 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all cursor-pointer border border-white/5 hover:border-transparent"
                        title="Supprimer la chanson"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  
                  {/* Card top */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 items-center">
                      <span className="px-2.5 py-1 rounded-full bg-[#0B0D10] text-[#A3FF12] font-sans font-semibold text-[10px] uppercase tracking-wider">
                        {song.occasion}
                      </span>
                      {song.isFeatured && (
                        <span className="px-2.5 py-1 rounded-full bg-[#A3FF12]/10 text-[#A3FF12] font-sans font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 border border-[#A3FF12]/20">
                          ✨ Vedette
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8A949F] font-mono pr-8 group-hover:pr-12 transition-all">{song.style}</span>
                  </div>

                  {/* Audio Player */}
                  <AudioPlayer
                    audioUrl={song.audioUrl}
                    title={song.title}
                    subtitle={`${song.language} • ${song.mood}`}
                    coverUrl={song.coverUrl}
                    startTime={song.startTime}
                    endTime={song.endTime}
                  />

                  {/* Description */}
                  <div className="space-y-3">
                    <p className="text-xs text-[#A2ABB5] leading-relaxed italic">
                      "{song.description}"
                    </p>

                    {/* Client feedback message */}
                    {song.clientReaction && (
                      <div className="p-3 bg-[#0B0D10]/20 rounded-xl border border-[#A3FF12]/5 space-y-1">
                        <span className="block text-[9px] uppercase tracking-widest font-mono text-[#A3FF12] font-bold">Retour Client</span>
                        <p className="text-[11px] text-[#A3FF12] leading-normal italic">
                          "{song.clientReaction}"
                        </p>
                      </div>
                    )}

                    {/* Admin visibility indicator */}
                    {isAdminUnlocked && (
                      <div className="p-2.5 bg-red-950/10 rounded-xl border border-red-500/10 flex items-center justify-between text-[9px] font-mono text-red-400">
                        <span>Visibilité : <strong>{song.visibility}</strong></span>
                        {song.clientFirstName && <span>Client : <strong>{song.clientFirstName}</strong></span>}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card CTA bottom */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  {/* Share component */}
                  <div className="flex items-center justify-between bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-2xl gap-3">
                    <span className="text-[10px] font-mono text-[#A2ABB5] font-medium">Partager le souvenir :</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareWhatsApp(song)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold border border-emerald-500/20"
                        title="Partager sur WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white text-white" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleCopyLink(song)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-[#C3CAD2] rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/5"
                        title="Copier le lien"
                      >
                        {copiedSongId === song.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('order', { songTemplate: song.title, category: song.occasion, style: song.style, mood: song.mood })}
                    className="w-full py-3.5 bg-gradient-to-r from-[#A3FF12]/10 to-[#7ACC00]/10 hover:from-[#A3FF12] hover:to-[#7ACC00] text-[#A3FF12] hover:text-black font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer text-center border border-[#A3FF12]/20 hover:border-transparent"
                  >
                    Commander une chanson similaire
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0B0D10] rounded-3xl border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-[#8A949F]">
              <Music className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white">Aucun exemple trouvé</h3>
              <p className="text-xs text-[#A2ABB5] max-w-sm mx-auto">Essayez de modifier vos critères de recherche ou sélectionnez d'autres options de filtre.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOccasion('all');
                setSelectedStyle('all');
              }}
              className="text-xs text-[#A3FF12] underline font-semibold cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

      </div>

      {/* ------------------------------------
          MODAL: UNLOCK ADMIN MODE
          ------------------------------------ */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleUnlockAdmin}
            className="w-full max-w-md bg-[#0B0D10] border border-red-500/20 p-8 rounded-3xl space-y-6 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-4 right-4 text-[#8A949F] hover:text-white p-1.5"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-extrabold text-xl text-white">Console d'Édition Galerie</h3>
              <p className="text-xs text-[#8A949F]">Accès sécurisé pour l'équipe Studio VOXMORY.</p>
            </div>

            <p className="text-xs text-[#A2ABB5] leading-relaxed text-center">
              Connectez-vous au studio VOXMORY pour modifier la galerie. La
              vérification se fait côté serveur, aucune clé n'est conservée dans
              le navigateur.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Déverrouiller
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------
          MODAL: EDIT GALLERY SONG
          ------------------------------------ */}
      {editingSong && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0D10] border border-red-500/20 max-w-2xl w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-8 text-left">
            <button
              onClick={() => setEditingSong(null)}
              className="absolute top-4 right-4 text-[#8A949F] hover:text-white p-1.5"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-xl text-white flex items-center gap-2">
                <span className="text-[#A3FF12]">📝</span>
                <span>Modifier la Chanson</span>
              </h3>
              <p className="text-xs text-[#8A949F]">Mettez à jour les données, la découpe (Teaser) ou téléversez de nouveaux fichiers.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Titre de la chanson *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reine Georgette"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Occasion *</label>
                  <select
                    value={editOccasion}
                    onChange={(e) => setEditOccasion(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                  >
                    <option value="Anniversaire">Anniversaire</option>
                    <option value="Mariage">Mariage</option>
                    <option value="Hommage / Deuil">Hommage / Deuil</option>
                    <option value="Déclaration d'amour">Déclaration d'amour</option>
                    <option value="Collation / Diplôme">Collation / Diplôme</option>
                    <option value="Naissance">Naissance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Rythme / Style *</label>
                  <select
                    value={editStyle}
                    onChange={(e) => setEditStyle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                  >
                    <option value="Rumba congolaise">Rumba congolaise</option>
                    <option value="Afrobeat">Afrobeat</option>
                    <option value="Acoustique émotionnel">Acoustique émotionnel</option>
                    <option value="Gospel">Gospel</option>
                    <option value="Zouk">Zouk</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Langue</label>
                  <input
                    type="text"
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Ambiance / Mood</label>
                  <input
                    type="text"
                    value={editMood}
                    onChange={(e) => setEditMood(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#A2ABB5] uppercase font-mono block">Fichier Audio (MP3/WAV) *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="URL de l'audio"
                    value={editAudioUrl}
                    onChange={(e) => setEditAudioUrl(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                  <label className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 bg-[#A3FF12]/10 hover:bg-[#A3FF12]/20 text-[#A3FF12] border border-[#A3FF12]/20 rounded-xl text-xs font-bold cursor-pointer transition-all">
                    {isUploadingEditAudio ? 'Téléversement...' : 'Remplacer Audio'}
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      disabled={isUploadingEditAudio}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#A2ABB5] uppercase font-mono block">Image de Couverture</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="URL de l'image"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                  <label className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 bg-[#A3FF12]/10 hover:bg-[#A3FF12]/20 text-[#A3FF12] border border-[#A3FF12]/20 rounded-xl text-xs font-bold cursor-pointer transition-all">
                    {isUploadingEditCover ? 'Téléversement...' : 'Remplacer Pochette'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      disabled={isUploadingEditCover}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-red-950/10 p-4 rounded-2xl border border-red-500/10">
                <div className="col-span-2">
                  <span className="block text-[11px] text-red-400 font-bold uppercase font-mono">✂️ Métrage / Découpe d'écoute (Teaser)</span>
                  <span className="block text-[9px] text-[#8A949F]">Modifiez le timing de lecture publique pour masquer le morceau complet.</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Début (secondes)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 30"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Fin (secondes)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 90"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Histoire / Description de la chanson</label>
                <textarea
                  rows={2}
                  placeholder="Histoire d'origine..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Retour Émotionnel du Client</label>
                <textarea
                  rows={2}
                  placeholder="Commentaire de réaction..."
                  value={editClientReaction}
                  onChange={(e) => setEditClientReaction(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Option de Visibilité</label>
                  <select
                    value={editVisibility}
                    onChange={(e: any) => setEditVisibility(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer focus:border-red-500"
                  >
                    <option value="Public anonymous">Anonyme public</option>
                    <option value="Public with first name">Public avec prénom client</option>
                    <option value="Demo only">Maquette / Démo uniquement</option>
                    <option value="Private">Privé (Admin uniquement)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Prénom du Client</label>
                  <input
                    type="text"
                    placeholder="Ex: Sarah"
                    value={editClientFirstName}
                    onChange={(e) => setEditClientFirstName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A2ABB5] uppercase font-mono">Identifiant Page Souvenir (Slug/ID VOXMORY)</label>
                <input
                  type="text"
                  placeholder="Ex: maman-georgette (Laissez vide pour utiliser l'identifiant par défaut)"
                  value={editMemorySlug}
                  onChange={(e) => setEditMemorySlug(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-[#7ACC00] hover:from-red-500 hover:to-[#7ACC00] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-lg hover:shadow-red-950/20"
                >
                  Enregistrer les modifications
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
