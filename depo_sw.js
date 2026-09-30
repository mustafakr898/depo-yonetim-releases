// OTOMATIK URETILDI (web_sw_uret.ps1) â€” elle duzenleme.
// Cevrimdisi acilis: uygulama dosyalari onbellekte; veri tarayici DB'sinde.
const SURUM = 'depo-0.9.79-20260930101151';
// [yol, icerik parmak izi] â€” onbellek anahtari 'yol?h=iz' (eslesmede
// ignoreSearch kullanildigindan sayfa istekleri etkilenmez).
const DOSYALAR = [
  ['./', 'b0100192e6ef88e9'],
  ['assets/AssetManifest.bin', 'db9fde3bc0ced0a7'],
  ['assets/AssetManifest.bin.json', '2f68cd8c4dead63e'],
  ['assets/assets/fonts/NotoSans-Bold.ttf', 'cf382cad35e731fc'],
  ['assets/assets/fonts/NotoSans-Regular.ttf', '3be6b371cef19ed6'],
  ['assets/assets/teklif/c4.jpeg', 'ef1c72d1524f2993'],
  ['assets/assets/teklif/hager.png', 'd530d562ea61c4f5'],
  ['assets/assets/teklif/interra.png', '165f0d423566ef41'],
  ['assets/assets/teklif/knx.jpeg', '1336dfa9a84d5bec'],
  ['assets/assets/teklif/powerline.png', 'a81dbe7200d226c8'],
  ['assets/assets/templates/ariza_formu.xlsx', 'f4ee5e762220b3ec'],
  ['assets/assets/templates/teklif_sablonu.xlsx', 'ce889afa269be8d3'],
  ['assets/FontManifest.json', 'cd7e03645bc44b2d'],
  ['assets/fonts/MaterialIcons-Regular.otf', '60945de13cd0dbc0'],
  ['assets/packages/cupertino_icons/assets/CupertinoIcons.ttf', '3d90c370aa4cf00d'],
  ['assets/shaders/ink_sparkle.frag', '5aee0e4ff369c055'],
  ['assets/shaders/stretch_effect.frag', 'c723fbb5b9a3456b'],
  ['canvaskit/skwasm_heavy.js', '7a1aa20e765441b2'],
  ['canvaskit/skwasm_heavy.wasm', '33f5c52d1612df0a'],
  ['favicon.png', '7f201137e1514bbb'],
  ['flutter.js', 'a483fd28f51ed2fa'],
  ['flutter_bootstrap.js', '93be0370da525793'],
  ['icons/Icon-192.png', 'fe651cf5393b36f0'],
  ['icons/Icon-512.png', 'e0459aacdef87583'],
  ['icons/Icon-maskable-192.png', '32ff1d29f8102e3f'],
  ['icons/Icon-maskable-512.png', '0a22c7f69a0829a5'],
  ['index.html', 'b0100192e6ef88e9'],
  ['main.dart.mjs', '802212743ce10293'],
  ['main.dart.wasm', 'df55fed6b0f836e4'],
  ['manifest.json', '42500596ad8aa888'],
  ['sqflite_sw.js', '946284ef26b62b59'],
  ['sqlite3.wasm', '922a76b182b6af69'],
  ['vendor/zxing-0.21.3.min.js', 'd7cc8f69dd70bdcf'],
  ['vendor/zxing-LICENSE.txt', '849b3ff4527ff587'],
  ['version.json', '334d3a26e67bc2d9'],
];

// Zayif mobil agda tek dosya yarida kalirsa TUM kurulum dusuyordu (telefon
// eski surumde takili kalip her acilista 17 MB'i bastan deniyordu) -> 3 deneme.
const getir = (f, deneme) =>
  fetch(new Request(f + '?v=' + SURUM, { cache: 'reload' }))
    .then((y) => { if (!y.ok) throw new Error(f + ' ' + y.status); return y; })
    .catch((err) => {
      if (deneme >= 3) throw err;
      return new Promise((ok) => setTimeout(ok, deneme * 1500))
        .then(() => getir(f, deneme + 1));
    });

self.addEventListener('install', (e) => {
  // ?v=SURUM: GitHub Pages CDN'inin ESKI kopyasi yeni onbellege girmesin
  // (sorgu dizesi CDN'de ayri anahtar). Parmak izi AYNI dosya onceki
  // surumun onbelleginden kopyalanir (yeniden inmez).
  e.waitUntil(
    caches.open(SURUM)
      .then((c) => Promise.all(DOSYALAR.map(([f, iz]) => {
        const anahtar = new Request(f + '?h=' + iz);
        return caches.match(anahtar)
          .then((eski) => eski ? eski : getir(f, 1))
          .then((yanit) => c.put(anahtar, yanit));
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  // Yalniz BU uygulamanin eski onbellekleri silinir â€” ayni alan adindaki
  // diger sitelerin (github.io koku ortak) onbelleklerine dokunulmaz.
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks
        .filter((k) => k.startsWith('depo-') && k !== SURUM)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Yazi tipleri (Roboto vb. fonts.gstatic.com'dan iner): ilk cevrimici
  // acilista SAKLANIR, sonra onbellekten â€” depoda internetsiz acilista yazilar
  // kaybolmasin. Onbellek adi 'depo-' ile baslamaz â†’ surum guncellemesinde
  // SILINMEZ (yazi tipi dosyalari surumden bagimsiz).
  if (u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('yazi-depo-1').then((c) =>
      c.match(r).then((x) => x || fetch(r).then((y) => {
        if (y.ok || y.type === 'opaque') c.put(r, y.clone());
        return y;
      }))));
    return;
  }
  // Bulut (Supabase), GitHub surum kontrolu vb. â€” HER ZAMAN ag.
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    // Sayfa: once ag (guncel surum), yoksa onbellek (cevrimdisi acilis).
    // Zayif baglantida 4 sn icinde yanit yoksa onbellekten acilir.
    const onbellek = () => caches.match('index.html', { ignoreSearch: true })
      .then((x) => x || caches.match('./'));
    e.respondWith(
      Promise.race([
        fetch(r),
        new Promise((_, red) => setTimeout(() => red(new Error('zaman')), 4000)),
      ]).catch(() => onbellek().then((x) => x || fetch(r)))
    );
    return;
  }
  // Uygulama dosyalari: once onbellek, yoksa ag.
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then((x) => x || fetch(r))
  );
});