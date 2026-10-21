/**
 * Comparaison de contenu.
 *
 * Les réponses du serveur sont des objets neufs à chaque lecture, même
 * quand rien n'a changé. Les comparer par référence ferait donc croire à
 * une mise à jour permanente, et l'interface se redessinerait sans arrêt
 * pour rien. On compare le fond, pas l'emballage.
 */
export function memeContenu(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
