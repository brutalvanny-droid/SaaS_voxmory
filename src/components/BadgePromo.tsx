import type { HomeConfig } from '../types.js';

/**
 * Badge promotionnel.
 *
 * Il est composant public, délibérément séparé du studio : l'importer
 * depuis l'administration entraînerait tout l'écran de réglage dans la
 * page d'accueil, et donc dans ce que le visiteur télécharge.
 *
 * Il se lit comme une affichette : une forme, une couleur, deux mots. Pas
 * besoin de lire couramment pour comprendre qu'il se passe quelque chose.
 */

export const COULEURS_PROMO = [
  { id: 'vert', libelle: 'Vert', classe: 'bg-[#A3FF12] text-black' },
  { id: 'rouge', libelle: 'Rouge', classe: 'bg-[#FF4D4D] text-white' },
  { id: 'or', libelle: 'Or', classe: 'bg-[#FFC53D] text-black' },
  { id: 'bleu', libelle: 'Bleu', classe: 'bg-[#3DA5FF] text-white' },
] as const;

export default function BadgePromo({
  promo,
  onClick,
}: {
  promo: HomeConfig['promo'];
  onClick?: () => void;
}) {
  if (!promo.actif || !promo.texte) return null;

  const couleur = COULEURS_PROMO.find((c) => c.id === promo.couleur) ?? COULEURS_PROMO[0];

  const contenu = (
    <>
      <span className="block font-black leading-tight">{promo.texte}</span>
      {promo.sousTexte && (
        <span className="block text-[10px] font-semibold mt-0.5 opacity-90 leading-tight">
          {promo.sousTexte}
        </span>
      )}
    </>
  );

  const commun = `${couleur.classe} shadow-lg text-center`;

  if (promo.forme === 'ruban') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={promo.texte}
        className={`${commun} px-4 py-2 rounded-md -rotate-6 hover:rotate-0 transition-transform`}
      >
        <span className="block text-[13px]">{contenu}</span>
      </button>
    );
  }

  if (promo.forme === 'eclair') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={promo.texte}
        className={`${commun} w-28 h-24 flex flex-col items-center justify-center px-2`}
        style={{ clipPath: 'polygon(24% 0, 100% 0, 76% 100%, 0 100%)' }}
      >
        <span className="block text-[12px]">{contenu}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={promo.texte}
      className={`${commun} w-24 h-24 rounded-full flex flex-col items-center justify-center px-2`}
    >
      <span className="block text-[12px]">{contenu}</span>
    </button>
  );
}
