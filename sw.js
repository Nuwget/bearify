// bearify não é PWA. Este worker só existe para limpar quem instalou uma versão
// antiga: apaga os caches e se desregistra. Nenhuma página o registra mais.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
})()));
