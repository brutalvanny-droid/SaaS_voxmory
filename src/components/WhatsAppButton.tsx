import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { WHATSAPP_NUMBER, whatsappUrl } from '../lib/contact.js';

/**
 * Bouton WhatsApp flottant.
 *
 * Au Congo, WhatsApp n'est pas un canal parmi d'autres : c'est là que les
 * gens se parlent. Un visiteur qui hésite préfère poser sa question plutôt
 * que remplir un formulaire. Ce bouton lui évite de remonter chercher le
 * numéro en bas de page.
 *
 * Trois retenues, pour qu'il aide sans gêner :
 *
 * - **Il n'apparaît pas tout de suite.** En haut de page, le visiteur lit
 *   encore ; un bouton qui surgit cache le texte. On attend qu'il ait
 *   commencé à descendre.
 * - **Il se replie.** Ouvert, il propose trois raccourcis ; fermé, il ne
 *   dépasse pas d'un pouce. Personne n'est obligé de le regarder.
 * - **Il s'efface devant l'essentiel.** Sur l'espace client et le studio,
 *   il n'a rien à faire.
 */

/** Sens d'ouverture du panneau, selon la place disponible. */
type Panneau = { titre: string; message: string }[];

const RACCOURCIS: Panneau = [
  {
    titre: 'Commander une chanson',
    message:
      "Bonjour VOXMORY, je souhaite commander une chanson personnalisée. Pouvez-vous me guider ?",
  },
  {
    titre: 'Suivre ma commande',
    message:
      "Bonjour VOXMORY, je voudrais savoir où en est ma commande. Ma référence est : ",
  },
  {
    titre: 'Demander un tarif',
    message:
      "Bonjour VOXMORY, je voudrais connaître vos tarifs pour une chanson personnalisée.",
  },
];

export default function WhatsAppButton({ masquer = false }: { masquer?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const boutonRef = useRef<HTMLDivElement>(null);
  const mouvementReduit = useReducedMotion();

  // Apparition après un début de lecture : avant, le bouton gênerait.
  useEffect(() => {
    const surDefilement = () => setVisible(window.scrollY > 320);
    surDefilement();
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, []);

  /**
   * Clic ailleurs : referme le panneau.
   *
   * Sans cela, il resterait ouvert indéfiniment et masquerait le contenu
   * qu'on essaie de lire.
   */
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e: MouseEvent) => {
      if (!boutonRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surTouche);
    };
  }, [ouvert]);

  if (masquer) return null;

  return (
    <div
      ref={boutonRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ---- Panneau de raccourcis ---- */}
      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={mouvementReduit ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={mouvementReduit ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            // Origine en bas à droite : le panneau « sort » du bouton.
            style={{ transformOrigin: 'bottom right' }}
            className="w-[min(19rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0B0D10]/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <p className="text-[13.5px] font-bold text-white">Écrivez-nous</p>
              <p className="text-[12px] text-[#8A949F] mt-0.5 leading-relaxed">
                Réponse en quelques minutes, aux heures d'ouverture.
              </p>
            </div>

            <div className="p-2">
              {RACCOURCIS.map((r, i) => (
                <motion.a
                  key={r.titre}
                  href={whatsappUrl(r.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOuvert(false)}
                  initial={mouvementReduit ? { opacity: 0 } : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: mouvementReduit ? 0 : 0.04 * i, duration: 0.22 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[#C2CAD3] hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-[#25D366]/12 flex-shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  </span>
                  {r.titre}
                </motion.a>
              ))}
            </div>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOuvert(false)}
              className="block px-4 py-3 text-[12.5px] font-semibold text-[#25D366] hover:bg-[#25D366]/[0.07] border-t border-white/[0.06] transition-colors"
            >
              Ouvrir la conversation →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Bouton ---- */}
      <AnimatePresence>
        {visible && (
          <motion.button
            onClick={() => setOuvert((v) => !v)}
            initial={mouvementReduit ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={mouvementReduit ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 16 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 480, damping: 26 }}
            aria-label={ouvert ? 'Fermer le menu WhatsApp' : 'Nous écrire sur WhatsApp'}
            aria-expanded={ouvert}
            className="relative grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_8px_28px_-6px_rgba(37,211,102,0.55)] cursor-pointer"
          >
            {/*
              Onde d'attention : trois cercles qui s'élargissent et
              s'effacent, en décalage. Cela se remarque sans jamais devenir
              une agitation permanente — et disparaît dès que le panneau est
              ouvert, où l'on n'a plus besoin d'attirer l'œil.
            */}
            {!ouvert && !mouvementReduit && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-[#25D366]"
                    initial={{ opacity: 0.55, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.85 }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      delay: i * 0.85,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={ouvert ? 'fermer' : 'ouvrir'}
                initial={mouvementReduit ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={mouvementReduit ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.6 }}
                transition={{ duration: 0.18 }}
                className="grid place-items-center"
              >
                {ouvert ? <X className="w-6 h-6" /> : <WhatsAppGlyph />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Logo WhatsApp officiel.
 *
 * Repris au tracé plutôt qu'importé : il tient dans un bouton de 56 pixels
 * et reste net sur les écrans à forte densité.
 */
function WhatsAppGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16.04 4C9.96 4 5.02 8.94 5.02 15.02c0 1.94.51 3.83 1.47 5.5L4.7 28l7.65-2.01a11 11 0 0 0 3.69.64h.01c6.08 0 11.02-4.94 11.02-11.02C27.07 8.94 22.12 4 16.04 4Zm0 20.1h-.01a9.1 9.1 0 0 1-4.63-1.27l-.33-.2-4.53 1.19 1.21-4.42-.21-.36a9.06 9.06 0 0 1-1.39-4.84c0-5.02 4.09-9.1 9.11-9.1a9.06 9.06 0 0 1 9.1 9.1c0 5.02-4.09 9.1-9.1 9.1Zm5.32-6.79c-.29-.15-1.72-.85-1.99-.94-.27-.1-.46-.15-.66.14-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07a7.4 7.4 0 0 1-2.19-1.35 8.2 8.2 0 0 1-1.51-1.88c-.16-.29-.02-.44.12-.59.13-.13.29-.34.44-.51.14-.17.19-.29.29-.49.1-.19.05-.36-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2 3.16 4.93 4.31.69.29 1.22.46 1.64.59.69.22 1.32.19 1.82.11.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34Z" />
    </svg>
  );
}
