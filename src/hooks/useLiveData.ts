import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Données vivantes.
 *
 * Un site vitrine change pendant qu'on le regarde : une chanson ajoutée
 * depuis le studio, une promotion lancée, un avis validé. Sans
 * synchronisation, le visiteur doit recharger la page pour le voir — et
 * un visiteur ne recharge jamais.
 *
 * Trois déclencheurs, et rien de plus :
 *
 * 1. **Un intervalle**, pour le visiteur qui laisse la page ouverte.
 * 2. **Le retour sur l'onglet**, pour celui qui revient dessus après
 *    avoir consulté autre chose. C'est le cas le plus fréquent, et le
 *    seul qu'une synchronisation naïve par intervalle rate.
 * 3. **Le retour du réseau**, si le téléphone a perdu sa connexion.
 *
 * Et deux économies, parce qu'une synchronisation bête vide la batterie :
 *
 * - **Rien ne tourne dans un onglet caché.** Un onglet en arrière-plan ne
 *   consomme pas un octet : ce qu'on y télécharge, personne ne le voit.
 * - **Rien ne tourne hors ligne.** Interroger le serveur sans réseau
 *   produit des erreurs, pas des données.
 *
 * La mise à jour est enfin comparée avant d'être appliquée : sans cela,
 * chaque passage recréerait les objets et l'interface se redessinerait
 * sans raison visible.
 */

interface Options<T> {
  /** Recharge les données. */
  charger: () => Promise<T>;
  /** Intervalle en millisecondes. 60 000 par défaut. */
  intervalleMs?: number;
  /**
   * Compare deux versions. Par défaut, comparaison superficielle du JSON.
   * Sert à éviter les rafraîchissements inutiles.
   */
  egal?: (a: T, b: T) => boolean;
  /** Désactive la synchronisation (par exemple pour le studio). */
  actif?: boolean;
}

function memeJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function useLiveData<T>({
  charger,
  intervalleMs = 60_000,
  egal = memeJson,
  actif = true,
}: Options<T>) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<Error | null>(null);
  const [majLe, setMajLe] = useState<Date | null>(null);

  // La fonction de chargement change à chaque rendu si elle est définie
  // en ligne ; on garde la dernière dans une référence pour ne pas
  // relancer l'effet à chaque fois.
  const chargerRef = useRef(charger);
  chargerRef.current = charger;
  const egalRef = useRef(egal);
  egalRef.current = egal;

  const rafraichir = useCallback(async () => {
    // Hors ligne : inutile d'insister, on réessaiera au retour du réseau.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    try {
      const frais = await chargerRef.current();
      setDonnees((actuel) => {
        if (actuel !== null && egalRef.current(actuel, frais)) return actuel;
        setMajLe(new Date());
        return frais;
      });
      setErreur(null);
    } catch (e) {
      // Une panne passagère ne doit pas vider l'écran : on garde ce
      // qu'on a et on retentera au prochain tour.
      setErreur(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  useEffect(() => {
    if (!actif) return;

    let minuteur: ReturnType<typeof setInterval> | null = null;
    let visible = true;

    const demarrer = () => {
      if (minuteur !== null) return;
      minuteur = setInterval(() => {
        if (document.visibilityState === 'visible') void rafraichir();
      }, intervalleMs);
    };

    const arreter = () => {
      if (minuteur !== null) {
        clearInterval(minuteur);
        minuteur = null;
      }
    };

    const surVisibilite = () => {
      if (document.visibilityState === 'visible') {
        visible = true;
        void rafraichir();
        demarrer();
      } else {
        visible = false;
        arreter();
      }
    };

    // Premier chargement immédiat.
    void rafraichir();
    if (document.visibilityState === 'visible') demarrer();

    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('online', () => void rafraichir());

    return () => {
      arreter();
      document.removeEventListener('visibilitychange', surVisibilite);
      void visible;
    };
  }, [actif, intervalleMs, rafraichir]);

  return { donnees, erreur, majLe, rafraichir };
}
