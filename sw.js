const CACHE = 'bearify-v1';
const ASSETS = ['./','./index.html','./css/style.css','./js/app.js','./js/ui.js','./js/engine.js','./js/art.js','./js/covers.js','./js/world.js','./js/mascots.js','./js/boot.js','./js/fx.js','./data/tracks.js','./data/library.js','./manifest.webmanifest','./media/favicon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('.m4a') || url.pathname.endsWith('.mp3')) return; // no cache audio
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); });
