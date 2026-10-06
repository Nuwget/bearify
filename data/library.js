// bearify · biblioteca derivada do catálogo real (sem mock de músicas).
// Playlists fixas + "Liked Songs" (montada do Store). Tudo referencia ids de TRACKS.
window.LIBRARY = (() => {
  const T = window.TRACKS;
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));
  const ARTISTS = [{ id: 'nuwget', name: 'nuwget', bio: 'Songs do nuwget — feitas com IA, tocadas no bearify.' }];
  const ALBUMS = [{ id: 'bearify-sessions', title: 'bearify sessions', artistId: 'nuwget', artist: 'nuwget', year: 2026, tracks: T.map((t) => t.id) }];
  const PLAYLISTS = [
    { id: 'pl-sessions', name: 'bearify sessions', desc: 'Todas as songs do nuwget.', tracks: T.map((t) => t.id) },
    { id: 'pl-madrugada', name: 'madrugada', desc: 'Pra ouvir com chuva na janela.', tracks: ['in-the-blue', 'silentreminante'] },
    { id: 'pl-ouvindo', name: 'continue ouvindo', desc: 'Retome de onde parou.', tracks: [] },
  ];
  return { ARTISTS, ALBUMS, PLAYLISTS, byId };
})();
