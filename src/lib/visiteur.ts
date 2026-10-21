/**
 * Identifiant de visiteur anonyme.
 *
 * Pour savoir si quelqu'un revient, il faut pouvoir le reconnaître — mais
 * pas l'identifier. On tire donc un nombre au hasard, conservé dans le
 * navigateur : le site sait « cette personne est déjà venue », sans jamais
 * savoir qui elle est.
 *
 * C'est la même information qu'un outil de mesure classique, sans les
 * cookies publicitaires ni le transfert de données vers un tiers.
 */

const CLE = 'voxmory_vid';

/**
 * Un an. Au-delà, on repart d'un nouvel identifiant : la personne est
 * traitée comme nouvelle, ce qui est honnête puisqu'on ne peut pas
 * raisonnablement affirmer le contraire après si longtemps.
 */
export function identifiantVisiteur(): string {
  try {
    const existant = localStorage.getItem(CLE);
    if (existant && existant.length <= 64) return existant;

    const nouveau = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    localStorage.setItem(CLE, nouveau);
    return nouveau;
  } catch {
    // Navigation privée, stockage refusé : on retombe sur un identifiant
    // valable pour la page seulement. La visite sera comptée, mais
    // l'attribuer à une personne précise ne sera pas possible.
    return `s_${Math.random().toString(36).slice(2, 18)}`;
  }
}

/**
 * Signale une page vue.
 *
 * Ne bloque jamais la navigation : si la mesure échoue, la page continue
 * de s'afficher normalement. Une statistique ratée se remplace, une page
 * blanche non.
 */
export function signalerVue(path: string): void {
  try {
    void fetch('/api/stats/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: identifiantVisiteur(),
        path,
        referrer: document.referrer || '',
      }),
      // Ne retient pas le déchargement de la page : la requête doit
      // pouvoir être abandonnée si l'utilisateur part vite.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Rien à faire : on ne casse pas le site pour une statistique.
  }
}
