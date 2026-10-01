/* 変更したら index.html の APP_VERSION と同じ値に上げる（README「バージョン」参照） */
const VERSION = "1.6.2";
const CACHE = "kuchi-log-" + VERSION;
const ASSETS = [
  "./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./vendor/tesseract/tesseract.min.js", "./vendor/tesseract/worker.min.js",
  "./vendor/tesseract/core/tesseract-core.wasm.js", "./vendor/tesseract/core/tesseract-core-simd.wasm.js",
  "./vendor/tesseract/core/tesseract-core-lstm.wasm.js", "./vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "./vendor/tesseract/lang/jpn.traineddata.gz"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 画面本体はオンラインなら毎回最新を取りにいく。古い画面を優先すると、
  // 新しい Service Worker を登録する JavaScript 自体が読み込まれず更新できない。
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
