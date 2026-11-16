/* Service worker Krosciculus : jeu jouable hors ligne + mises à jour automatiques.

   Fonctionnement :
   - Le jeu est servi instantanément depuis le cache (marche hors ligne).
   - La page demande régulièrement au service worker (CHECK_UPDATE) s'il existe une nouvelle
     version de index.html sur le serveur. La comparaison se fait sur l'ETag, en ignorant
     le cache HTTP du navigateur (cache: 'no-cache').
   - Si une nouvelle version existe, elle est téléchargée en attente, et la page affiche
     « Nouvelle version disponible ». Au clic (APPLY_UPDATE), elle remplace l'ancienne.
   - Aucune action manuelle nécessaire à chaque mise à jour du jeu.

   VERSION : à changer seulement pour forcer le rechargement de TOUS les fichiers
   (icônes, manifest...) chez tous les joueurs. */
const VERSION = 'v3';
const CACHE = 'krosciculus-' + VERSION;
const PAGE = './index.html';
const PENDING = './__nouvelle-version__';
const ASSETS = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './maskable-512.png', './apple-touch-icon.png'];

// Signature d'une réponse : ETag (sinon Last-Modified), sans le préfixe « W/ » des ETags faibles.
const sigOf = (r) => {
  if (!r || !r.headers) return '';
  return (r.headers.get('etag') || r.headers.get('last-modified') || '').replace(/^W\//, '');
};

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: 'reload' = on contourne le cache HTTP pour récupérer vraiment la dernière version.
    await Promise.all([PAGE, ...ASSETS].map(async (url) => {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error('Échec du téléchargement : ' + url);
      await cache.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('krosciculus-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Vérifie s'il existe une nouvelle version du jeu. Renvoie true si une mise à jour est prête.
let checking = null;
function checkForUpdate() {
  if (!checking) {
    checking = (async () => {
      const cache = await caches.open(CACHE);
      const current = await cache.match(PAGE);
      if (!current) return false;
      const res = await fetch(PAGE, { cache: 'no-cache' });
      if (!res || !res.ok) return false;
      const fresh = sigOf(res);
      const cur = sigOf(current);
      if (!fresh || !cur || fresh === cur) {
        if (res.body) res.body.cancel().catch(() => {});
        await cache.delete(PENDING);
        return false;
      }
      const pending = await cache.match(PENDING);
      if (pending && sigOf(pending) === fresh) {
        if (res.body) res.body.cancel().catch(() => {});
      } else {
        await cache.put(PENDING, res);
      }
      return true;
    })().catch(() => false).finally(() => { checking = null; });
  }
  return checking;
}

// Remplace la version affichée par la nouvelle version en attente.
async function applyUpdate() {
  const cache = await caches.open(CACHE);
  let next = await cache.match(PENDING);
  if (!next) {
    const res = await fetch(PAGE, { cache: 'no-cache' });
    if (res && res.ok) next = res;
  }
  if (next) await cache.put(PAGE, next);
  await cache.delete(PENDING);
}

self.addEventListener('message', (e) => {
  const type = e.data && e.data.type;
  const src = e.source;
  if (type === 'CHECK_UPDATE') {
    e.waitUntil(checkForUpdate().then((ready) => { if (ready && src) src.postMessage({ type: 'UPDATE_READY' }); }));
  } else if (type === 'APPLY_UPDATE') {
    e.waitUntil(applyUpdate().catch(() => {}).then(() => { if (src) src.postMessage({ type: 'UPDATE_APPLIED' }); }));
  }
});

// Réponse immédiate depuis le cache. Les fichiers secondaires sont rafraîchis en arrière-plan.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !fonts) return;
  const isNav = req.mode === 'navigate';
  const key = isNav ? PAGE : req;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key);
    const refresh = async () => {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) await cache.put(key, res.clone());
      return res;
    };
    if (cached) {
      if (!isNav) { try { e.waitUntil(refresh().catch(() => {})); } catch (_) {} }
      return cached;
    }
    try { return await refresh(); }
    catch (_) { return (isNav && await cache.match(PAGE)) || Response.error(); }
  })());
});
