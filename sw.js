// RAIDROOM has shut down. This replaces the old app's service worker: it deletes the cached app,
// removes itself, and reloads open windows so they show the shutdown notice from the network.
self.addEventListener("install", () => self.skipWaiting());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clearCaches = async () => { for (const key of await caches.keys()) await caches.delete(key); };

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    // The old worker may still be answering a request (and re-filling its cache); let it finish.
    await sleep(1500);
    await clearCaches();
    await self.registration.unregister();
    // A window that is still loading can't be navigated yet: try again for a few seconds.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let failed = 0;
      for (const client of await self.clients.matchAll({ type: "window" })) {
        try { await client.navigate(client.url); } catch { failed += 1; }
      }
      if (failed === 0) break;
      await sleep(1000);
    }
    await clearCaches();
  })());
});
// No fetch handler: every request goes straight to the network.
