import { ALL_CACHES, ALL_CACHES_LIST, removeUnusedCaches } from './sw/caches';

const FALLBACK_IMAGE_URL = 'https://localhost:3100/images/fallback-grocery.png';

self.addEventListener('install', event => {
  // Do the stuff needed at install time.
  // This may not be the active service worker yet.
  event.waitUntil(
    caches.open(ALL_CACHES.fallbackImages).then((cache) => {
      cache.add(FALLBACK_IMAGE_URL)
    })
  );
});

self.addEventListener('activate', event => {
  // We are ready to take the stage.
  event.waitUntil(removeUnusedCaches(ALL_CACHES_LIST));
});

function fetchImageOrFallback(fetchEvent) {
  return fetch(fetchEvent.request, {
    mode: 'cors'
  }).then((response) => {
    if (!response.ok) {
      return caches.match(FALLBACK_IMAGE_URL, {cacheName: ALL_CACHES.fallbackImages});
    } else return response;
  }).catch(() => {
    return caches.match(FALLBACK_IMAGE_URL, {cacheName: ALL_CACHES.fallbackImages});
  });
}

self.addEventListener('fetch', event => {
  // Intercept a network request.

  // Get the Acecpt header from the request
  let acceptHeader = event.request.headers.get('accept');
  // Build a URL object from the request's url string
  let requestUrl = new URL(event.request.url);

  if (acceptHeader.indexOf('image/*') >= 0 && // if it's an image
    requestUrl.pathname.indexOf('/images/') === 0) { // and the url looks right
    event.respondWith(
      fetchImageOrFallback(event)
    );
  }
});