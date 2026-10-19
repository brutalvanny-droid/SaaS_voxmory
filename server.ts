/**
 * Serveur de développement local (et de repli auto-hébergé).
 *
 * En production sur Vercel, c'est `api/index.ts` qui est utilisé. Ce fichier
 * sert à reproduire fidèlement l'environnement serverless en local :
 *   - l'API tourne sur le port 3001 ;
 *   - Vite (port 5173) y redirige toutes les requêtes /api ;
 *   - en mode production (`npm start`), il sert également le dossier dist.
 */

import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import app from './api/app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const express = (await import('express')).default;
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  const required = [
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['ADMIN_JWT_SECRET', process.env.ADMIN_JWT_SECRET],
  ].filter(([, v]) => !v);

  console.log(`\n[VOXMORY] API en écoute sur http://localhost:${PORT}`);
  console.log(
    `[VOXMORY] Paiements SasPay : ${process.env.SASPAY_API_KEY ? 'configurés' : 'non configurés'}`,
  );
  console.log(
    `[VOXMORY] WhatsApp : ${process.env.OPENWA_URL ? 'configuré' : 'non configuré'}`,
  );
  console.log(
    `[VOXMORY] Stockage : ${process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'local (public/uploads)'}`,
  );

  if (required.length > 0) {
    console.warn(
      `\n⚠️  Variables manquantes : ${required.map(([k]) => k).join(', ')}`,
    );
    console.warn('   Copiez .env.example vers .env puis complétez-le.\n');
  }
  console.log('');
});
