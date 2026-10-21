import { useEffect } from 'react';

/**
 * Verrouille le défilement de la page.
 *
 * Quand un menu ou une fenêtre recouvre l'écran, laisser la page bouger
 * derrière donne l'impression d'un site qui se dérègle : on fait défiler,
 * le contenu d'arrière-plan file, et au moment de fermer on a perdu sa
 * place. Ce hook gèle la page sans provoquer de saut.
 *
 * Deux détails qui font la différence :
 *
 * - **La barre de défilement.** La faire disparaître d'un coup décale toute
 *   la page de sa largeur. On compense avec une marge équivalente.
 * - **La position.** On la mémorise et on la restitue à la fermeture, au
 *   lieu de laisser la page remonter brutalement en haut.
 *
 * Le verrou est compté : plusieurs fenêtres ouvertes en même temps ne se
 * débloquent pas entre elles.
 */

let compteur = 0;
let position = 0;
let stylePrecedent: { overflow: string; paddingRight: string } | null = null;

export function useScrollLock(actif: boolean): void {
  useEffect(() => {
    if (!actif) return;

    const { body, documentElement } = document;

    if (compteur === 0) {
      position = window.scrollY;

      // Largeur réelle de la barre de défilement, ou zéro sur les
      // navigateurs qui la superposent au contenu.
      const largeurBarre = window.innerWidth - documentElement.clientWidth;

      stylePrecedent = {
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
      };

      body.style.overflow = 'hidden';
      if (largeurBarre > 0) {
        const margeActuelle = parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${margeActuelle + largeurBarre}px`;
      }
    }

    compteur += 1;

    return () => {
      compteur -= 1;

      if (compteur === 0 && stylePrecedent) {
        body.style.overflow = stylePrecedent.overflow;
        body.style.paddingRight = stylePrecedent.paddingRight;
        stylePrecedent = null;

        // Restitution sans animation : « smooth » produirait un défilement
        // visible sur toute la hauteur de la page.
        const precedent = documentElement.style.scrollBehavior;
        documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, position);
        documentElement.style.scrollBehavior = precedent;
      }
    };
  }, [actif]);
}
