const NAME='sodaro-training-v1';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./assets/brain-logo.png','./assets/app-icon.png','./assets/app-icon-512.png','./assets/case-01.jpg','./assets/case-02.jpg','./assets/case-03.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(NAME).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==NAME).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));});
