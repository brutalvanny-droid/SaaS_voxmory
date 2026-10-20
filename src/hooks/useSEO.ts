import { useEffect } from 'react';

/**
 * Référencement d'une application monopage.
 *
 * Un site monopage ne recharge jamais le document : le <title> et les balises
 * meta restent donc ceux de la toute première page, quoi qu'affiche l'écran.
 * Pour un moteur de recherche — et pour tout partage sur les réseaux — chaque
 * écran passerait pour la page d'accueil.
 *
 * Ce crochet réécrit ces balises à chaque changement d'écran, en réutilisant
 * toujours les mêmes nœuds du DOM plutôt que d'en créer de nouveaux : les
 * accumulateurs de balises sont une fuite de mémoire classique.
 */

export interface SeoData {
  title: string;
  description: string;
  /** Chemin absolu, sans domaine : « /pack/chanson-simple » */
  path: string;
  /** Image de partage. Reprend l'image du site par défaut. */
  image?: string;
  type?: string;
}

const SITE = 'https://saa-s-voxmory.vercel.app';
const SITE_NAME = 'VOXMORY';
const DEFAULT_IMAGE = `${SITE}/og-image.jpg`;

/**
 * Crée la balise si elle manque, la met à jour sinon.
 * `attr` vaut « name » pour les balises classiques, « property » pour Open Graph.
 */
function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }

  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }

  el.setAttribute('href', href);
}

export function useSEO({ title, description, path, image, type = 'website' }: SeoData): void {
  useEffect(() => {
    const url = `${SITE}${path === '/' ? '' : path}`;
    const img = image ?? DEFAULT_IMAGE;

    document.title = title;

    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    // Open Graph — vignette et titre lors d'un partage
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);

    // Twitter / X — reprend les mêmes informations
    upsertMeta('property', 'twitter:title', title);
    upsertMeta('property', 'twitter:description', description);
    upsertMeta('property', 'twitter:url', url);
    upsertMeta('property', 'twitter:image', img);
    upsertMeta('property', 'twitter:card', 'summary_large_image');
  }, [title, description, path, image, type]);
}

/**
 * Injecte un bloc de données structurées (JSON-LD) et le retire au démontage.
 *
 * Les moteurs lisent ce bloc pour afficher prix, étoiles et disponibilités
 * directement dans leurs résultats. Un seul bloc « aggregate » par écran.
 */
export function useJsonLd(id: string, data: Record<string, unknown> | null): void {
  useEffect(() => {
    if (!data) return;

    // On retire d'abord toute version précédente du même bloc.
    document.getElementById(id)?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, data]);
}
