// bearify · biblioteca derivada do catálogo real (sem mock de músicas).
// Playlists são mixtapes com conceito próprio; "continue ouvindo" é montada
// na hora com as recentes (ver allPlaylists em ui.js).
window.LIBRARY = (() => {
  const T = window.TRACKS;
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));
  const ARTISTS = [{ id: 'nuwget', name: 'nuwget', bio: 'Songs do nuwget — feitas com IA, tocadas no bearify.' }];
  const ALBUMS = [{ id: 'made-with-heart', title: 'Made with Heart', artistId: 'nuwget', artist: 'nuwget', year: 2026, tagline: 'songs by Dudu & his AI agents · made with heart 💜', tracks: T.map((t) => t.id) }];
  const PLAYLISTS = [
    { id: 'pl-sessions', name: 'made with heart', desc: 'The full sessions — songs by Dudu & his AI agents.', tracks: T.map((t) => t.id) },
    { id: 'pl-madrugada', name: 'madrugada', desc: 'Pra ouvir com chuva na janela, de fones.', tracks: ['welcome-to-your-past', 'silentreminante'] },
    { id: 'pl-mare', name: 'maré alta', desc: 'As que grudam — pro repeat até decorar.', tracks: ['in-the-blue', 'just-a-little-more-time'] },
    { id: 'pl-ouvindo', name: 'continue ouvindo', desc: 'Retome exatamente de onde parou.', tracks: [] },
  ];
  return { ARTISTS, ALBUMS, PLAYLISTS, byId };
})();
