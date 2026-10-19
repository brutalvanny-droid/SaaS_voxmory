import app from './app.js';

/**
 * Point d'entrée Vercel.
 *
 * L'application Express est exportée telle quelle : une app Express est une
 * fonction `(req, res)`, exactement la signature attendue par le runtime Node
 * de Vercel. Toutes les routes (`/api/*`) sont acheminées ici par les
 * réécritures définies dans vercel.json.
 */
export default app;
