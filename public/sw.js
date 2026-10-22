/**
 * Service worker VOXMORY — lecture hors ligne et réseau instable.
 *
 * Deux stratégies, selon la nature de la requête :
 *
 * 1. **Document (navigation)** → réseau d'abord.
 *    Le HTML référence des fichiers JavaScript dont le nom change à
 *    chaque déploiement. Si l'on servait un HTML en cache alors que les
 *    fichiers correspondants ont été remplacés sur le serveur, la page
 *    s'ouvrirait blanche. Le réseau fait donc foi ; le cache n'est
 *    qu'un filet de sécurité quand la connexion manque.
 *
 * 2. **Ressources (JS, CSS, images, polices)** → cache d'abord.
 *    Ces fichiers portent une empreinte dans leur nom : un fichier
 *    inchangé n'a aucune raison d'être retéléchargé, et un fichier
 *    modifié porte un autre nom.
 */

const CACHE_NAME = 'voxmory-v2';

const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/images/hero-poster.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.map((name) => (name !== CACHE_NAME ? caches.delete(name) : null))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Une réponse mérite-t-elle d'être conservée ? */
function cachable(response) {
  if (!response) return false;
  // `opaque` (police Google, par exemple) : on ne peut pas lire le statut,
  // mais la réponse est exploitable telle quelle.
  return response.status === 200 || response.type === 'opaque';
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Aucune écriture, aucun appel d'API : le cache ne doit jamais servir
  // une réponse métier périmée (prix, commandes, comptes).
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  // ---- 1. Pages : le réseau décide ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cachable(response)) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('Hors ligne', { status: 503, statusText: 'Hors ligne' })
          );
        }),
    );
    return;
  }

  // ---- 2. Ressources : le cache décide ----
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (cachable(response)) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => null);

      return cached || network;
    }),
  );
});

// ---- Notifications ----

self.addEventListener('push', (event) => {
  let data = { title: 'VOXMORY Studio', body: 'Mise à jour de votre commande en direct.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'VOXMORY Studio', body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Ouvrir VOXMORY' }],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    }),
  );
});
