// Retire service-worker registrations left by older builds of the application.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
