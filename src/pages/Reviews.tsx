import { useState, useEffect, FormEvent } from 'react';
import { Star, Sparkles, Check, Send } from 'lucide-react';
import { ClientReview } from '../types.js';
import Reveal from '../components/Reveal.js';

interface ReviewsProps {
  initialReviews: ClientReview[];
  onNavigate: (page: string) => void;
}

export default function Reviews({ initialReviews }: ReviewsProps) {
  const [reviews, setReviews] = useState<ClientReview[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(true);
  
  // Submit Review Form State
  const [clientName, setClientName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [occasion, setOccasion] = useState('Anniversaire');
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Pré-remplir le numéro de commande depuis l'URL (?order=VOX-...)
    const params = new URLSearchParams(window.location.search);
    const order = params.get('order');
    if (order) setOrderNumber(order);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Show only approved reviews
          setReviews(data.filter((r: any) => r.approved === true));
        }
      })
      .catch(err => console.error('Error fetching reviews', err))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName || !comment) return;

    setIsSubmitting(true);
    const newReview = {
      clientName,
      rating,
      comment,
      occasion,
      orderId: orderNumber || undefined,
      isVerified: Boolean(orderNumber),
      approved: false // requires admin approval
    };

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      
      if (response.ok) {
        setSubmitSuccess(true);
        setClientName('');
        setComment('');
        setRating(5);
        setOrderNumber('');
      }
    } catch (err) {
      console.error('Error submitting review', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-20 sm:py-24 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header Title */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#A3FF12]/20 bg-[#A3FF12]/[0.05] text-[#A3FF12] font-mono text-[11px] uppercase tracking-[0.16em]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Témoignages clients</span>
            </div>
            <h1 className="text-[clamp(2.1rem,5.6vw,3.75rem)] font-extrabold text-white tracking-[-0.04em] leading-[1.02]">
              Vos éclats de rire et vos <span className="text-gradient">larmes de joie</span>
            </h1>
            <p className="text-[#A2ABB5] text-[15px] sm:text-base leading-relaxed">
              Rien n'est plus précieux pour le Studio VOXMORY que de savoir que nos chansons ont touché le cœur de vos proches. Découvrez les retours d'émotions partagés par notre communauté.
            </p>
          </div>
        </Reveal>

        {/* Primary Layout Grid: Left Form, Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Submit Review Form */}
          <div className="lg:col-span-5 bg-[#0B0D10] border border-[#A3FF12]/10 p-6 sm:p-8 rounded-3xl space-y-6 h-fit">
            
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="font-sans font-extrabold text-xl text-white">Laisser un avis</h3>
              <p className="text-xs text-[#A2ABB5]">Votre chanson a fait pleurer ou danser ? Racontez-nous ce moment magique.</p>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-green-950/20 border border-green-500/20 rounded-2xl text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-base text-white">Avis envoyé avec succès !</h4>
                  <p className="text-xs text-[#A2ABB5] leading-relaxed">
                    Merci pour ce témoignage précieux. Pour des raisons de sécurité, votre avis sera visible après validation par notre équipe d'administration.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Laisser un autre avis
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3]">Votre Nom Complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tante Clarisse"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#A3FF12] focus:outline-none text-sm transition-all"
                  />
                </div>

                {/* Rating selection (Stars) */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3]">Note Globale *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="text-[#A3FF12] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${num <= rating ? 'fill-[#A3FF12]' : 'text-[#6C7581]'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold font-mono text-[#A3FF12] pl-2">{rating}/5 étoiles</span>
                  </div>
                </div>

                {/* Event Category / Occasion */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3]">Occasion célébrée *</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#A3FF12] focus:outline-none text-sm appearance-none cursor-pointer"
                  >
                    <option value="Anniversaire">Anniversaire</option>
                    <option value="Mariage">Mariage</option>
                    <option value="Hommage / Deuil">Hommage / Deuil</option>
                    <option value="Déclaration d'amour">Déclaration d'amour</option>
                    <option value="Collation / Diplôme">Collation / Diplôme</option>
                    <option value="Naissance">Naissance</option>
                    <option value="Surprise">Autre événement</option>
                  </select>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3]">Votre Commentaire *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Racontez la réaction lors de l'écoute de la chanson, les pleurs, la surprise..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#A3FF12] focus:outline-none text-sm leading-relaxed transition-all"
                  />
                </div>

                {/* Optional Order Code */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#C2CAD3]">N° de Commande (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: VOX-2026-1034"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#A3FF12] focus:outline-none text-xs transition-all"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !clientName || !comment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] disabled:from-[#101317] disabled:to-[#101317] disabled:text-[#8A949F] text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Envoi...' : 'Publier mon avis'}</span>
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* RIGHT: List of active customer reviews */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="font-sans font-bold text-lg text-white">Témoignages ({reviews.length})</span>
              <span className="text-xs text-[#A3FF12] font-medium flex items-center gap-1">
                <span>Note Moyenne : 4.9/5</span>
                <Star className="w-3.5 h-3.5 fill-[#A3FF12] text-[#A3FF12]" />
              </span>
            </div>

            <div className="space-y-4 stagger-in">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`skeleton-review-${idx}`}
                    className="bg-[#0B0D10] border border-white/5 p-6 rounded-2xl space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 text-[#6C7581]">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 rounded bg-white/5"></div>
                        ))}
                      </div>
                      <div className="h-3 w-16 bg-white/5 rounded"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-3.5 bg-white/5 rounded w-full"></div>
                      <div className="h-3.5 bg-white/5 rounded w-11/12"></div>
                      <div className="h-3.5 bg-white/5 rounded w-4/5"></div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="h-4 bg-white/10 rounded w-24"></div>
                        <div className="h-3 bg-[#A3FF12]/10 rounded w-16"></div>
                      </div>
                      <div className="h-6 w-28 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ))
              ) : reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#0B0D10] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-[#A3FF12]/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex text-[#A3FF12] gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < rev.rating ? 'fill-[#A3FF12] text-[#A3FF12]' : 'text-[#6C7581]'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#8A949F] font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-sm text-[#C3CAD2] leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="block font-bold text-white text-sm">{rev.clientName}</span>
                        <span className="block text-[10px] text-[#A3FF12] uppercase tracking-widest font-mono font-bold mt-0.5">
                          {rev.occasion}
                        </span>
                      </div>

                      {rev.screenshotUrl && (
                        <div className="text-[10px] px-2 py-1 rounded bg-green-950/40 text-green-400 border border-green-500/20 font-bold">
                          Avis Vérifié (WhatsApp Capture)
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-black/40 border border-white/5 rounded-2xl text-[#A2ABB5] text-xs leading-relaxed">
                  Aucun témoignage n'a encore été publié pour le moment.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
