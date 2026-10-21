/**
 * Logo VOXMORY.
 *
 * Dessiné en SVG plutôt qu'importé en image : le logo sert à la fois de
 * favicon de 16 pixels et d'en-tête de page. En vectoriel, il reste net à
 * toutes les tailles et reprend exactement les couleurs de la marque.
 *
 * La marque réunit deux idées — *vox*, la voix ; *mory*, le souvenir. Les
 * barres de l'icône dessinent une onde sonore dont la courbe évoque un
 * cœur : ce qu'on offre, c'est une voix qui reste.
 */

/** Signal vert de la marque. */
export const VERT = '#A3FF12';

/**
 * Hauteurs des barres, en fraction de la hauteur maximale.
 *
 * Cinq barres et non sept : en dessous de 32 pixels, des barres plus
 * nombreuses se soudent en une masse informe où l'on ne distingue plus
 * l'onde sonore. Cinq barres bien espacées restent lisibles du favicon
 * jusqu'à l'en-tête de page.
 */
const COURBE = [0.48, 1.0, 0.7, 1.0, 0.48];

/** Géométrie de l'icône, calculée une fois pour toutes. */
const BARRES = (() => {
  const largeur = 5.6;
  const ecart = 2.8;
  const hauteurMax = 34;
  const total = COURBE.length * largeur + (COURBE.length - 1) * ecart;
  const depart = (44 - total) / 2;

  return COURBE.map((f, i) => {
    const h = hauteurMax * f;
    return { x: depart + i * (largeur + ecart), y: 22 - h / 2, w: largeur, h };
  });
})();

/**
 * Icône seule — onde sonore en cœur.
 *
 * Utilisée seule pour les favicons et les petites tailles, où le nom de la
 * marque serait illisible.
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="VOXMORY"
    >
      {BARRES.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={b.w / 2}
          fill={VERT}
        />
      ))}
    </svg>
  );
}

/**
 * Logo complet : icône et nom de marque.
 *
 * Le nom est composé de deux teintes — « VOX » en blanc, « MORY » en vert —
 * pour que l'œil relie le mot à l'icône qui le précède.
 */
export default function Logo({
  height = 34,
  withWordmark = true,
  className = '',
}: {
  height?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  if (!withWordmark) {
    return <LogoMark size={height} className={className} />;
  }

  // Rapport d'aspect du bloc complet (icône + marge + nom).
  const largeur = 240;

  return (
    <svg
      height={height}
      viewBox={`0 0 ${largeur} 44`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="VOXMORY"
    >
      {BARRES.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.w / 2} fill={VERT} />
      ))}

      {/*
        Le nom est du texte vivant, pas un tracé figé : il utilise la police
        déjà chargée par le site et reste donc net et cohérent avec le reste
        de la page.
      */}
      <text
        x="58"
        y="30"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="27"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        <tspan fill="#FFFFFF">VOX</tspan>
        <tspan fill={VERT}>MORY</tspan>
      </text>
    </svg>
  );
}
