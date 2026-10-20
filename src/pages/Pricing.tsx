import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Sparkles, Coins, Smartphone, Check, ShieldCheck, Heart, Gift, Users, Eye, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Reveal from '../components/Reveal.js';
import { Package } from '../types.js';
import { PACK_SLUGS } from '../seo/routes.js';

interface PricingProps {
  packages: Package[];
  onNavigate: (page: string, params?: any) => void;
}

export default function Pricing({ packages, onNavigate }: PricingProps) {
  // FAQ Collapsible State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Expanded details state for each package card
  const [expandedPkgs, setExpandedPkgs] = useState<Record<string, boolean>>({
    pack_simple: false,
    pack_musique_video: false,
    pack_premium_vip: false,
    pack_presentiel: false,
  });

  const toggleExpand = (pkgId: string) => {
    setExpandedPkgs(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId]
    }));
  };

  // Metric mappings for emotional visual indicators
  const metrics: Record<string, { emotion: number; souvenir: number; family: number }> = {
    pack_simple: { emotion: 4, souvenir: 3, family: 3 },
    pack_musique_video: { emotion: 5, souvenir: 4, family: 5 },
    pack_premium_vip: { emotion: 5, souvenir: 5, family: 5 },
    pack_presentiel: { emotion: 5, souvenir: 5, family: 5 }
  };

  const getMetricLabel = (val: number) => {
    if (val === 5) return "Exceptionnel";
    if (val === 4) return "Très Fort";
    return "Moyen";
  };

  // Badges per package
  const badges: Record<string, string> = {
    pack_musique_video: "Le choix idéal",
    pack_premium_vip: "Premium VIP",
    pack_presentiel: "Sur réservation"
  };

  // Specific custom CTAs
  const ctas: Record<string, string> = {
    pack_simple: "Choisir Chanson Simple",
    pack_musique_video: "Choisir cette formule",
    pack_premium_vip: "Choisir Premium VIP",
    pack_presentiel: "Vérifier la disponibilité"
  };

  const faqs = [
    {
      q: "Combien de temps prend la production d'une chanson ?",
      a: "Notre délai de production standard est de 3 à 5 jours selon la formule. Si vous êtes pressé par le temps pour un anniversaire ou une célébration de dernière minute, vous pouvez sélectionner l'option Express (72h) ou Super Express (24h) lors de la commande pour une mise en priorité immédiate de nos équipes."
    },
    {
      q: "Qui écrit les paroles et de quoi ai-je besoin ?",
      a: "Nos paroliers professionnels rédigent l'intégralité du texte. Vous n'avez pas besoin d'écrire de poèmes ni d'être inspiré : il vous suffit de nous donner des mots-clés, des anecdotes drôles, des noms indispensables, ou de nous parler naturellement par note vocale audio. Nous nous occupons d'y ajouter l'élégance poétique."
    },
    {
      q: "Est-ce que je peux écouter la chanson avant la livraison finale ?",
      a: "Oui, absolument ! Selon votre formule (notamment les packs Souvenir, Héritage, Cérémonie), nous vous envoyons d'abord une première ébauche ou maquette audio par WhatsApp. Vous pouvez la valider ou nous demander des corrections sur le texte ou le rythme avant que nous n'enregistrions la voix finale en studio."
    },
    {
      q: "Dans quelles langues nos musiciens chantent-ils ?",
      a: "Nous composons et chantons dans les langues les plus expressives de notre patrimoine : Français, Lingala, Swahili, Tshiluba, Kikongo, ou en mixant plusieurs d'entre elles selon vos préférences (ex: couplet en Français et refrain en Lingala chaleureux)."
    },
    {
      q: "Comment s'effectuent les paiements Mobile Money ?",
      a: "La sécurité et la simplicité sont nos priorités. Vous pouvez verser un acompte de 50% ou l'intégralité des frais de production par Airtel Money, M-Pesa, ou Orange Money. Envoyez ensuite simplement la preuve d'envoi sur WhatsApp pour que le studio de création commence le travail."
    },
    {
      q: "Comment vais-je recevoir ma chanson personnalisée ?",
      a: "À la finalisation, vous recevrez un fichier audio haute définition (MP3/WAV) directement sur votre WhatsApp ou e-mail. De plus, nous vous générons une Page Souvenir interactive privée (votre lien unique VOXMORY), contenant la chanson, les paroles écrites, la photo du destinataire, et un mot d'amour virtuel, idéale pour le partage familial."
    }
  ];

  return (
    <div className="min-h-[85vh] py-20 sm:py-28 text-white relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(163,255,18,0.1)_0%,_transparent_75%)] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-[radial-gradient(circle,_rgba(163,255,18,0.08)_0%,_transparent_75%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 space-y-20">
        
        {/* En-tête */}
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#A3FF12]/20 bg-[#A3FF12]/[0.05] text-[#A3FF12] font-mono text-[11px] uppercase tracking-[0.16em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Offrez l'immortalité en chanson</span>
            </div>
            <h1 className="text-[clamp(2.1rem,5.6vw,3.75rem)] font-extrabold text-white tracking-[-0.04em] leading-[1.02]">
              Créateurs d'<span className="text-gradient">émotions</span> &amp; de souvenirs
            </h1>
            <p className="text-[#A2ABB5] text-[15px] sm:text-base leading-relaxed max-w-2xl mx-auto">
              Bien plus qu'une production musicale : un héritage intemporel, des larmes de bonheur
              garanties et un trésor familial transmis à travers les générations.
            </p>
          </div>
        </Reveal>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {packages.map((pkg, index) => {
            const score = metrics[pkg.id] || { emotion: 4, souvenir: 4, family: 4 };
            const badge = badges[pkg.id];
            const isFeatured = pkg.id === 'pack_musique_video';
            const isExpanded = expandedPkgs[pkg.id];

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 * index }}
                className={`group border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
                  isFeatured
                    ? 'border-[#A3FF12]/40 bg-gradient-to-b from-[#A3FF12]/[0.07] to-transparent lg:scale-[1.02] shadow-[0_24px_60px_-24px_rgba(163,255,18,0.22)]'
                    : 'border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent hover:border-[#A3FF12]/30'
                }`}
              >
                {/* Badge of Trust / Distinction */}
                {badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 font-sans font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg ${
                    isFeatured 
                      ? 'bg-gradient-to-r from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] text-black'
                      : pkg.id === 'pack_premium_vip'
                      ? 'bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-white border border-[#A3FF12]/20'
                      : 'bg-[#161A20] text-[#A3FF12] border border-[#A3FF12]/10'
                  }`}>
                    {badge}
                  </span>
                )}

                <div className="space-y-6">
                  
                  {/* Name and Promise */}
                  <div className="space-y-2 text-center pt-2">
                    <h3 className="font-sans font-black text-xl text-white">
                      <button
                        onClick={() => onNavigate('pack', { slug: PACK_SLUGS[pkg.id] })}
                        className="hover:text-[#A3FF12] transition-colors cursor-pointer"
                        aria-label={`Découvrir la formule ${pkg.name}`}
                      >
                        {pkg.name}
                      </button>
                    </h3>
                    <p className="text-xs text-[#A3FF12]/70 italic leading-relaxed min-h-[40px] px-2">
                      « {pkg.promise} »
                    </p>
                  </div>

                  {/* Price and Delivery */}
                  <div className="border-y border-white/5 py-4 text-center space-y-1 bg-black/30 rounded-xl">
                    <span className="block font-sans font-black text-3xl text-[#A3FF12] tracking-tight">{pkg.priceLabel}</span>
                    <span className="block text-[10px] text-[#A3FF12] font-semibold tracking-wider uppercase">Délai : {pkg.deliveryTime}</span>
                  </div>

                  {/* Visual indicators of value */}
                  <div className="space-y-3 bg-[#161A20]/60 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-mono font-bold text-[#A2ABB5] uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#A3FF12] fill-[#A3FF12]" />
                      <span>Impact &amp; Valeur Estimés</span>
                    </h4>
                    
                    {/* Emotion Metric */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-[#C3CAD2]">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#A3FF12] fill-[#A3FF12]" /> Émotion
                        </span>
                        <span className="text-[#A3FF12]">{getMetricLabel(score.emotion)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] rounded-full" 
                          style={{ width: `${(score.emotion / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Souvenir Metric */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-[#C3CAD2]">
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3 text-[#A3FF12] fill-[#A3FF12]" /> Souvenir
                        </span>
                        <span className="text-[#A3FF12]">{getMetricLabel(score.souvenir)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] rounded-full" 
                          style={{ width: `${(score.souvenir / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Family Impact Metric */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-[#C3CAD2]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#A3FF12] fill-[#A3FF12]" /> Impact Famille
                        </span>
                        <span className="text-[#A3FF12]">{getMetricLabel(score.family)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] rounded-full" 
                          style={{ width: `${(score.family / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Deliverables Accordion ("Voir les détails") */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(pkg.id)}
                      className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#C3CAD2] hover:text-white transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#A3FF12]" />
                        {isExpanded ? "Masquer les détails" : "Voir les détails inclus"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <ul className="space-y-2.5 p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-[#C3CAD2]">
                            {pkg.includes.map((inc, i) => (
                              <li key={i} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-[#A3FF12] font-bold">✓</span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Call To Action */}
                <div className="pt-6">
                  <button
                    onClick={() => onNavigate('order', { packageId: pkg.id })}
                    className={`w-full py-3.5 rounded-xl font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer text-center ${
                      isFeatured
                        ? 'bg-gradient-to-r from-[#A3FF12] via-[#A3FF12] to-[#7ACC00] text-black hover:scale-[1.02] shadow-lg shadow-[#A3FF12]/10'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {ctas[pkg.id] || "Choisir cette formule"}
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Options supplémentaires / Add-ons */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-sans font-black text-2xl text-white flex items-center justify-center gap-2">
              <span className="text-xl">✨</span>
              <span>Options supplémentaires</span>
            </h2>
            <p className="text-xs text-[#A2ABB5]">Pour ajouter une touche encore plus mémorable et physique à votre attention.</p>
          </div>

          <div className="bg-gradient-to-br from-[#161A20] via-[#0B0D10] to-[#0B0D10] border border-[#A3FF12]/20 p-6 sm:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-2xl relative">
            
            {/* Corner Badge */}
            <span className="absolute -top-3 right-6 bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-white font-mono font-bold text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-[#A3FF12]/20">
              Cadeau Physique
            </span>

            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-sans font-black text-2xl text-white">Carte VIP Souvenir</h3>
                <span className="px-2.5 py-1 rounded-lg bg-[#A3FF12] text-black font-sans font-black text-sm">2 $</span>
              </div>
              <p className="text-sm text-[#A3FF12]/90 font-medium">
                « Une carte souvenir officielle VOXMORY pour rendre votre commande plus spéciale. »
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <ul className="space-y-1.5 text-xs text-[#C3CAD2]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span>Carte VIP personnalisée VOXMORY</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span>Nom du bénéficiaire inscrit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span>Code ou numéro souvenir unique</span>
                  </li>
                </ul>
                <ul className="space-y-1.5 text-xs text-[#C3CAD2]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span>Design premium avec reflets métalliques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span>Version digitale prête à partager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#A3FF12] text-xs">◆</span>
                    <span className="text-[#A3FF12] font-semibold">Peut être ajoutée à n’importe quelle formule</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col justify-center items-stretch pt-4 md:pt-0">
              <button
                onClick={() => onNavigate('order', { vipCardSelected: true, step: 7 })}
                className="w-full py-4 bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] hover:from-[#A3FF12] hover:to-[#7ACC00] text-white rounded-xl font-sans font-extrabold text-xs uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg shadow-[#A3FF12]/10 active:scale-95"
              >
                Ajouter la Carte VIP
              </button>
              <span className="text-center text-[10px] text-[#8A949F] mt-2">Livrée numériquement ou en main propre</span>
            </div>

          </div>
        </div>

        {/* Simple Comparison Grid */}
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-sans font-black text-2xl text-white">Comparez nos Formules</h2>
            <p className="text-xs text-[#A2ABB5]">Pour choisir exactement l'impact et les options dont vous avez besoin.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[#A2ABB5] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4">Avantages</th>
                  <th className="p-4">Chanson Simple</th>
                  <th className="p-4 text-[#A3FF12]">Musique + Vidéo</th>
                  <th className="p-4 text-[#A3FF12]">Premium VIP</th>
                  <th className="p-4">Prestation Présentielle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#C3CAD2]">
                <tr>
                  <td className="p-4 font-bold text-white">Tarif</td>
                  <td className="p-4">20 $</td>
                  <td className="p-4 font-bold text-[#A3FF12]">50 $</td>
                  <td className="p-4 font-bold text-[#A3FF12]">100 $</td>
                  <td className="p-4">À partir de 1000 $</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Durée Approximative</td>
                  <td className="p-4">1 à 2 minutes</td>
                  <td className="p-4">2 à 3 minutes</td>
                  <td className="p-4">3 à 4 minutes</td>
                  <td className="p-4">Live + Qualité Studio</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Format Audio Livré</td>
                  <td className="p-4">MP3 Haute Qualité</td>
                  <td className="p-4">WAV + MP3 Studio</td>
                  <td className="p-4">WAV + MP3 Studio</td>
                  <td className="p-4">Enregistrement Studio HD</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Montage Vidéo Souvenir</td>
                  <td className="p-4">❌ Non</td>
                  <td className="p-4">✅ Standard (Photos)</td>
                  <td className="p-4 text-[#A3FF12]">✅ Prestige (Premium)</td>
                  <td className="p-4">✅ Vidéo Live Souvenir</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Page Souvenir Privée</td>
                  <td className="p-4">❌ Non</td>
                  <td className="p-4">✅ Accès Privé QR Code</td>
                  <td className="p-4 text-[#A3FF12]">✅ Accès Premium à vie</td>
                  <td className="p-4">✅ Accès Premium à vie</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Révisions des Paroles</td>
                  <td className="p-4">1 Révision</td>
                  <td className="p-4">2 Révisions</td>
                  <td className="p-4 text-[#A3FF12]">✅ Prioritaire / Illimitée</td>
                  <td className="p-4">✅ Sur-Mesure Totale</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Carte VIP Souvenir</td>
                  <td className="p-4 text-[#8A949F]">Option (+2 $)</td>
                  <td className="p-4 text-[#8A949F]">Option (+2 $)</td>
                  <td className="p-4 text-[#A3FF12]">✅ Incluse Gratuite</td>
                  <td className="p-4">✅ Incluse Collector</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Support Client</td>
                  <td className="p-4">Standard</td>
                  <td className="p-4">Standard</td>
                  <td className="p-4 text-[#A3FF12]">✅ Ligne WhatsApp VIP</td>
                  <td className="p-4">✅ Ligne Directe Direction</td>
                </tr>
                <tr className="bg-white/5">
                  <td className="p-4"></td>
                  <td className="p-4">
                    <button onClick={() => onNavigate('order', { packageId: 'pack_simple' })} className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-all cursor-pointer">Choisir</button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onNavigate('order', { packageId: 'pack_musique_video' })} className="py-2 px-4 rounded-lg bg-gradient-to-r from-[#A3FF12] to-[#7ACC00] text-black font-bold transition-all cursor-pointer hover:scale-105">Choisir</button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onNavigate('order', { packageId: 'pack_premium_vip' })} className="py-2 px-4 rounded-lg bg-[#A3FF12] hover:bg-[#A3FF12] text-white font-bold transition-all cursor-pointer hover:scale-105">Choisir</button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => onNavigate('order', { packageId: 'pack_presentiel' })} className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-all cursor-pointer">Dispo</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Money payment guide board */}
        <div className="max-w-4xl mx-auto bg-[#09090d] border border-[#A3FF12]/15 p-6 sm:p-10 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-xl">
          
          <div className="md:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#A3FF12] font-bold uppercase tracking-widest font-mono">
              <Coins className="w-4 h-4" />
              <span>Paiement Sécurisé RDC</span>
            </span>
            <h3 className="font-sans font-extrabold text-2xl text-white leading-snug">
              Comment payer ma commande par Mobile Money ?
            </h3>
            <p className="text-sm text-[#C3CAD2] leading-relaxed">
              Pour initier la composition musicale, un versement d'acompte (50%) ou le règlement total de la formule choisie est requis. Nous prenons en charge l'ensemble des réseaux opérant en RDC.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">
              <ShieldCheck className="w-5 h-5" />
              <span>Garantie de remboursement intégral si non satisfait des paroles.</span>
            </div>
          </div>

          {/* Money Info details box */}
          <div className="md:col-span-5 bg-black p-6 rounded-2xl border border-white/5 space-y-4">
            <h4 className="font-sans font-bold text-xs text-[#A3FF12] tracking-wider flex items-center gap-1.5 uppercase">
              <Smartphone className="w-4 h-4" />
              <span>Numéros de Transfert</span>
            </h4>
            
            <div className="space-y-3 font-mono text-xs text-left">
              <div className="border-b border-white/5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8A949F]">Airtel Money :</span>
                  <span className="font-bold text-white text-sm">+243 978 508 099</span>
                </div>
                <div className="text-[10px] text-[#A3FF12]/80 mt-1 uppercase">Bénéficiaire : VANNY irung</div>
              </div>
              <div className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8A949F]">Orange Money :</span>
                  <span className="font-bold text-white text-sm">+243 891 170 023</span>
                </div>
                <div className="text-[10px] text-[#A3FF12]/80 mt-1 uppercase">Bénéficiaire : VANNY KAYEMB</div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 text-[10px] text-[#A2ABB5] leading-normal text-left">
              Après le transfert, envoyez simplement une copie/capture d'écran de l'opération sur WhatsApp pour valider la commande :
            </div>

            <a
              href="https://wa.me/243978508099?text=Bonjour%20VOXMORY%2C%20je%20souhaite%20valider%20le%20paiement%20de%20ma%20chanson."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Confirmer sur WhatsApp</span>
            </a>
          </div>

        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#A3FF12]" />
              <span>Foire aux Questions</span>
            </h2>
            <p className="text-xs text-[#A2ABB5] uppercase tracking-widest font-mono">Toutes les réponses à vos interrogations</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0B0D10] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left font-sans font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:bg-white/5 focus:outline-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-[#A3FF12]" /> : <ChevronDown className="w-4 h-4 text-[#8A949F]" />}
                </button>

                {openFaq === i && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#C3CAD2] leading-relaxed border-t border-white/5 animate-fade-in bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
