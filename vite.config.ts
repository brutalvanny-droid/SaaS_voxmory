import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:3001';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      // Nécessaire pour que l'aperçu fonctionne derrière un domaine relais
      // (environnements de prévisualisation, tunnels, etc.).
      allowedHosts: true as const,
      // En développement, l'API tourne dans un processus séparé (server.ts).
      // Le proxy évite tout problème de CORS et reproduit exactement le
      // comportement de production, où /api est servi par la fonction Vercel.
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // Le panneau d'administration est chargé à la demande : il représente
      // une part importante du code et n'a rien à faire dans le bundle des
      // visiteurs, dont la connexion est souvent une 3G.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['motion'],
            // Les icônes sont utilisées par presque toutes les pages : les
            // isoler permet au navigateur de les mettre en cache une fois
            // pour toutes, indépendamment du code applicatif.
            lucide: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
