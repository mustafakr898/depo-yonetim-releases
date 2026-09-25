// OTOMATIK URETILDI (web_sw_uret.ps1) â€” elle duzenleme.
// Cevrimdisi acilis: uygulama dosyalari onbellekte; veri tarayici DB'sinde.
const SURUM = 'depo-0.9.74-20260925121625';
const DOSYALAR = [
  './',
  'assets/AssetManifest.bin',
  'assets/AssetManifest.bin.json',
  'assets/assets/fonts/NotoSans-Bold.ttf',
  'assets/assets/fonts/NotoSans-Regular.ttf',
  'assets/assets/teklif/c4.jpeg',
  'assets/assets/teklif/hager.png',
  'assets/assets/teklif/interra.png',
  'assets/assets/teklif/knx.jpeg',
  'assets/assets/teklif/powerline.png',
  'assets/assets/templates/ariza_formu.xlsx',
  'assets/assets/templates/teklif_sablonu.xlsx',
  'assets/FontManifest.json',
  'assets/fonts/MaterialIcons-Regular.otf',
  'assets/packages/cupertino_icons/assets/CupertinoIcons.ttf',
  'assets/shaders/ink_sparkle.frag',
  'assets/shaders/stretch_effect.frag',
  'canvaskit/skwasm_heavy.js',
  'canvaskit/skwasm_heavy.wasm',
  'favicon.png',
  'flutter.js',
  'flutter_bootstrap.js',
  'icons/Icon-192.png',
  'icons/Icon-512.png',
  'icons/Icon-maskable-192.png',
  'icons/Icon-maskable-512.png',
  'index.html',
  'main.dart.mjs',
  'main.dart.wasm',
  'manifest.json',
  'sqlite3.wasm',
  'vendor/zxing-0.21.3.min.js',
  'vendor/zxing-LICENSE.txt',
  'version.json',
];

self.addEventListener('install', (e) => {
  // ?v=SURUM: GitHub Pages CDN'inin ESKI kopyasi yeni onbellege girmesin
  // (sorgu dizesi CDN'de ayri anahtar). Eslesmede ignoreSearch kullanilir.
  e.waitUntil(
    caches.open(SURUM)
      .then((c) => Promise.all(DOSYALAR.map((f) =>
        fetch(new Request(f + '?v=' + SURUM, { cache: 'reload' }))
          .then((yanit) => {
            if (!yanit.ok) throw new Error(f + ' ' + yanit.status);
            return c.put(new Request(f), yanit);
          }))))
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