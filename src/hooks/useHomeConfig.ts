import { useCallback } from 'react';
import { api } from '../lib/api.js';
import type { HomeConfig } from '../types.js';
import { useLiveData } from './useLiveData.js';

/**
 * Contenu de la page d'accueil.
 *
 * Une promotion lancée depuis le studio doit apparaître sans que le
 * visiteur recharge quoi qu'il fasse. On interroge donc le serveur
 * régulièrement — et jamais dans un onglet caché, où personne ne verrait
 * le résultat.
 */

const DEFAUT: HomeConfig = {
  hero: {
    videoUrl: '/images/hero.mp4',
    webmUrl: '/images/hero.webm',
    posterUrl: '/images/hero-poster.jpg',
  },
  promo: {
    actif: false,
    texte: '',
    sousTexte: '',
    forme: 'pastille',
    couleur: 'vert',
    position: 'droite',
  },
  vitrine: {
    chansons: 3,
    avis: 3,
  },
};

export function useHomeConfig() {
  const charger = useCallback(() => api.home(), []);
  const { donnees } = useLiveData<HomeConfig>({
    charger,
    // Trente secondes : une promotion est souvent lancée pour quelques
    // heures, on ne veut pas la rater d'un quart d'heure.
    intervalleMs: 30_000,
  });

  return donnees ?? DEFAUT;
}

export { DEFAUT as HOME_PAR_DEFAUT };
