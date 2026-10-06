// bearify · biblioteca derivada do catálogo real (sem mock de músicas).
// Playlists são mixtapes com conceito próprio; "continue ouvindo" é montada
// na hora com as recentes (ver allPlaylists em ui.js).
window.LIBRARY = (() => {
  const T = window.TRACKS;
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));
  const ARTISTS = [{ id: 'nuwget', name: 'nuwget', bio: 'Songs do nuwget — feitas com IA, tocadas no bearify.' }];
  const ALBUMS = [{ id: 'bearify-sessions', title: 'bearify sessions', artistId: 'nuwget', artist: 'nuwget', year: 2026, tracks: T.map((t) => t.id) }];
  const PLAYLISTS = [
    { id: 'pl-sessions', name: 'bearify sessions', desc: 'A coleção completa — todas as songs do nuwget.', tracks: T.map((t) => t.id) },
    { id: 'pl-madrugada', name: 'madrugada', desc: 'Pra ouvir com chuva na janela, de fones.', tracks: ['welcome-to-your-past', 'silentreminante'] },
    { id: 'pl-mare', name: 'maré alta', desc: 'As que grudam — pro repeat até decorar.', tracks: ['in-the-blue', 'just-a-little-more-time'] },
    { id: 'pl-ouvindo', name: 'continue ouvindo', desc: 'Retome exatamente de onde parou.', tracks: [] },
  ];
  return { ARTISTS, ALBUMS, PLAYLISTS, byId };
})();
