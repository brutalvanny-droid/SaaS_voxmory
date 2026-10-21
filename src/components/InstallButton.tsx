/**
 * Bouton d'installation de l'application.
 *
 * Volontairement inerte pour l'instant : l'expérience « installer sur
 * l'écran d'accueil » se déclenche d'elle-même sur mobile, et un bouton
 * ajouté à côté faisait double emploi. Le composant est conservé pour ne
 * pas casser les emplacements qui l'appellent déjà.
 */
interface InstallButtonProps {
  variant?: 'navbar' | 'footer' | 'default' | 'pill' | 'mobile-menu';
  className?: string;
  onNavigate?: (page: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function InstallButton(_props: InstallButtonProps) {
  return null;
}
