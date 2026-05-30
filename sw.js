const CACHE_NAME = 'ccna-study-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(()=>{})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ⚠️ 忽略擴充功能的請求（chrome-extension://）
  if(url.protocol === 'chrome-extension:') return;

  // Supabase API 永遠走網路，不快取
  if(url.hostname.includes('supabase.co')) return;

  // fonts / icons 靜態資源快取優先
  if(url.hostname.includes('googleapis.com') || url.hostname.includes('jsdelivr.net')){
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // index.html 快取優先（讓 App 離線可開啟）
  if(url.pathname === '/' || url.pathname.endsWith('.html')){
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }
});
