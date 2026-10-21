/**
 * Coordonnées de contact.
 *
 * Un numéro de téléphone recopié à trois endroits finit toujours par être
 * mis à jour à deux. Quand le studio change de ligne, le pied de page
 * garde l'ancienne et les clients tombent sur quelqu'un d'autre — ou sur
 * personne. Il est donc déclaré une seule fois, ici.
 */

/** Numéro du studio, au format international sans « + » ni espaces. */
export const WHATSAPP_NUMBER = '243978508099';

/** Adresse e-mail de contact. */
export const CONTACT_EMAIL = 'usvanny10@gmail.com';

/**
 * Fabrique un lien WhatsApp.
 *
 * `wa.me` ouvre la conversation dans l'application si elle est installée,
 * dans le navigateur sinon — inutile de détecter quoi que ce soit.
 *
 * Le message pré-rempli part encodé : un point d'interrogation ou un
 * retour à la ligne non échappé tronquerait la phrase.
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Lien e-mail, objet compris. */
export function mailtoUrl(subject?: string): string {
  if (!subject) return `mailto:${CONTACT_EMAIL}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
