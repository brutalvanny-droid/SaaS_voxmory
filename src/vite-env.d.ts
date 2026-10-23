/// <reference types="vite/client" />

/**
 * Variables d'environnement exposées au navigateur.
 *
 * Elles doivent être déclarées ici : sans cela, `import.meta.env.MA_VAR`
 * n'est pas typé — et surtout, Vite ne remplace la valeur que sur un accès
 * **littéral**. Un accès dynamique (`(import.meta as any).env[clé]`) renvoie
 * `undefined` dans le build de production, ce qui désactive silencieusement
 * la fonctionnalité concernée.
 */
interface ImportMetaEnv {
  /** Identifiant public du pixel Meta. */
  readonly VITE_META_PIXEL_ID?: string;
  /** Identifiant de mesure Google Analytics. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
