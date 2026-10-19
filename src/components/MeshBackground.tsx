/**
 * Fond à dégradés diffus, dérivé des teintes relevées dans les références :
 * vert forêt profond, vert vif et noir bleuté.
 *
 * Deux nappes seulement, animées très lentement : au-delà, l'œil perçoit du
 * mouvement et l'effet devient distrayant plutôt qu'atmosphérique.
 */
export default function MeshBackground({
  intensity = 0.5,
  className = '',
}: {
  intensity?: number;
  className?: string;
}) {
  return (
    <div className={`mesh-bg ${className}`} aria-hidden="true">
      <div
        className="mesh-blob animate-drift-a"
        style={{
          width: '62vw',
          height: '62vw',
          top: '-22vw',
          left: '-12vw',
          opacity: 0.42 * intensity,
          background:
            'radial-gradient(circle at 30% 30%, rgba(163,255,18,0.30) 0%, rgba(11,61,30,0.35) 45%, transparent 70%)',
        }}
      />
      <div
        className="mesh-blob animate-drift-b"
        style={{
          width: '54vw',
          height: '54vw',
          top: '18vw',
          right: '-16vw',
          opacity: 0.34 * intensity,
          background:
            'radial-gradient(circle at 60% 40%, rgba(37,251,38,0.20) 0%, rgba(6,40,20,0.30) 50%, transparent 72%)',
        }}
      />
      <div
        className="mesh-blob"
        style={{
          width: '46vw',
          height: '46vw',
          bottom: '-14vw',
          left: '24vw',
          opacity: 0.22 * intensity,
          background:
            'radial-gradient(circle at 50% 50%, rgba(80,120,160,0.16) 0%, transparent 68%)',
        }}
      />
      {/* Trame fine : donne de la structure aux grands aplats. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 55% at 50% 0%, #000 20%, transparent 75%)',
        }}
      />
    </div>
  );
}
