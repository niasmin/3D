// Offline cache for the web build. BUILD is stamped by tools/build_web.py so each release gets a fresh cache.
const BUILD='samkok3d-3';
const CACHE='samkok3d-'+BUILD;
const CORE=['./','three/config.js?v=3','three/backend.js?v=3','three/game3d.js?v=3','three/game3d.css?v=3','index.html','manifest.webmanifest','icon-192.png','ui/city2.webp','ui/avatar.webp','ui/bf-village.webp','ui/bf-gate.webp','ui/bf-harbor.webp',
  'ui/n-city.webp','ui/n-heroes.webp','ui/n-team.webp','ui/n-train.webp','ui/n-camp.webp'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())) });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('samkok3d-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())) });
self.addEventListener('fetch',e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=='GET' || u.origin!==location.origin || !u.href.startsWith(self.registration.scope)) return; // Supabase, fonts and CDNs go straight to the network
  if(r.mode==='navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/')){
    // page: network first so updates arrive, cache when offline
    e.respondWith(fetch(r).then(res=>{ const c=res.clone(); caches.open(CACHE).then(x=>x.put(r,c)); return res }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
    return;
  }
  // images and other static files: cache first
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok){ const c=res.clone(); caches.open(CACHE).then(x=>x.put(r,c)) } return res })));
});
