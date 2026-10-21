import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Vidéo d'accueil.
 *
 * Trois précautions, parce qu'une vidéo d'arrière-plan mal intégrée coûte
 * plus qu'elle n'apporte :
 *
 * 1. **Affiche d'abord.** Sans `poster`, l'écran reste noir le temps du
 *    téléchargement. L'affiche est une image fixe extraite de la vidéo :
 *    le visiteur voit immédiatement quelque chose de juste.
 * 2. **Chargement différé.** La vidéo ne part qu'une fois la page prête et
 *    la connexion jugée correcte. Sur un forfait mobile cher, on ne dépense
 *    pas 400 Ko sans nécessité : l'affiche suffit amplement.
 * 3. **Mouvement respecté.** Certaines personnes sont malades ou gênées par
 *    les animations. Le réglage système `prefers-reduced-motion` est écouté
 *    et, s'il est actif, l'affiche reste seule à l'écran.
 *
 * La vidéo est muette : le son ne doit jamais surprendre un visiteur.
 */

interface ConnexionRapide {
  effectiveType?: string;
  saveData?: boolean;
}

export default function HeroVideo({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [pret, setPret] = useState(false);
  const mouvementReduit = useReducedMotion();

  useEffect(() => {
    // Rien ne sert de lancer le téléchargement avant que la page soit
    // affichée : on laisse d'abord le texte et les boutons se mettre en
    // place, la vidéo suit.
    let annule = false;

    const demarrer = () => {
      if (annule) return;
      if (mouvementReduit) return;

      const c = (navigator as Navigator & { connection?: ConnexionRapide }).connection;
      // En économie de données ou en 2G, on s'abstient : l'affiche suffit.
      if (c?.saveData) return;
      if (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)) return;

      setPret(true);
    };

    // Deux tours de frame : la page a le temps de peindre.
    const a = requestAnimationFrame(() => requestAnimationFrame(demarrer));
    return () => {
      annule = true;
      cancelAnimationFrame(a);
    };
  }, [mouvementReduit]);

  return (
    <>
      {/* Affiche : visible immédiatement, et seule image si la vidéo ne
          démarre pas. C'est elle qui garantit qu'il n'y a jamais de trou. */}
      <img
        src="/images/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
        // L'affiche est le premier élément peint de la page : on l'indique au
        // navigateur pour qu'il la traite en priorité.
        fetchPriority="high"
      />

      {pret && (
        <video
          ref={ref}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${className}`}
          // autoPlay + muted + playsInline : sans ces trois-là réunis, aucun
          // navigateur mobile n'accepte de lancer la lecture seul.
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          style={{ opacity: 0 }}
        >
          <source src="/images/hero.webm" type="video/webm" />
          <source src="/images/hero.mp4" type="video/mp4" />
        </video>
      )}

      {/*
        Voile sombre. Sans lui, le texte blanc passerait par-dessus les
        zones claires du plan et deviendrait illisible sur les téléviseurs
        et les écrans mal calibrés.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#06080A] via-[#06080A]/85 to-[#06080A]/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#06080A] via-transparent to-[#06080A]/60"
      />
    </>
  );
}
