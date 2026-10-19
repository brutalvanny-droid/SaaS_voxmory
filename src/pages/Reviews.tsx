import { useState, useEffect, FormEvent } from 'react';
import { Star, MessageCircle, Sparkles, Check, Send } from 'lucide-react';
import { ClientReview } from '../types.js';

interface ReviewsProps {
  initialReviews: ClientReview[];
  onNavigate: (page: string) => void;
}

export default function Reviews({ initialReviews, onNavigate }: ReviewsProps) {
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
      orderNumber,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
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
    <div className="min-h-[85vh] py-16 bg-[#040206] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header Title */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-yellow-400 font-mono text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Témoignages Clients</span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white">
            Vos éclats de rire et vos larmes de joie
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Rien n'est plus précieux pour le Studio VOXMORY que de savoir que nos chansons ont touché le cœur de vos proches. Découvrez les retours d'émotions partagés par notre communauté.
          </p>
        </div>

        {/* Primary Layout Grid: Left Form, Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Submit Review Form */}
          <div className="lg:col-span-5 bg-[#0e0e12] border border-yellow-500/10 p-6 sm:p-8 rounded-3xl space-y-6 h-fit">
            
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="font-sans font-extrabold text-xl text-white">Laisser un avis</h3>
              <p className="text-xs text-gray-400">Votre chanson a fait pleurer ou danser ? Racontez-nous ce moment magique.</p>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-green-950/20 border border-green-500/20 rounded-2xl text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-base text-white">Avis envoyé avec succès !</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
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
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Votre Nom Complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tante Clarisse"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none text-sm transition-all"
                  />
                </div>

                {/* Rating selection (Stars) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Note Globale *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="text-yellow-400 hover:scale-110 transition-all cursor-pointer focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${num <= rating ? 'fill-yellow-400' : 'text-gray-600'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold font-mono text-yellow-500 pl-2">{rating}/5 étoiles</span>
                  </div>
                </div>

                {/* Event Category / Occasion */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Occasion célébrée *</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none text-sm appearance-none cursor-pointer"
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
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Votre Commentaire *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Racontez la réaction lors de l'écoute de la chanson, les pleurs, la surprise..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none text-sm leading-relaxed transition-all"
                  />
                </div>

                {/* Optional Order Code */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">N° de Commande (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: VOX-2026-1034"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none text-xs transition-all"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !clientName || !comment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
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
              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                <span>Note Moyenne : 4.9/5</span>
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              </span>
            </div>

            <div className="space-y-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`skeleton-review-${idx}`}
                    className="bg-[#0c0c10] border border-white/5 p-6 rounded-2xl space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 text-gray-700">
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
                        <div className="h-3 bg-pink-500/10 rounded w-16"></div>
                      </div>
                      <div className="h-6 w-28 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ))
              ) : reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#0c0c10] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-purple-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex text-yellow-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="block font-bold text-white text-sm">{rev.clientName}</span>
                        <span className="block text-[10px] text-pink-400 uppercase tracking-widest font-mono font-bold mt-0.5">
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
                <div className="text-center py-12 bg-black/40 border border-white/5 rounded-2xl text-gray-400 text-xs leading-relaxed">
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
