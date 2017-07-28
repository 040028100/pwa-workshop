import {
  ALL_CACHES, ALL_CACHES_LIST,
  removeUnusedCaches,
  precacheStaticAssets
} from './sw/caches';

const FALLBACK_IMAGE_URL = 'https://localhost:3100/images/fallback-grocery.png';

const INDEX_HTML_PATH = '/';
const INDEX_HTML_URL = new URL(INDEX_HTML_PATH, self.location).toString();

self.addEventListener('install', event => {
  // Do the stuff needed at install time.
  // This may not be the active service worker yet.
  event.waitUntil(
    caches.open(ALL_CACHES.fallbackImages).then((cache) => {
      cache.add(FALLBACK_IMAGE_URL).then(() => {
        return precacheStaticAssets();
      })
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

  let isApiCall = requestUrl.origin === 'https://localhost:3100';
  let isLocal = new URL(event.request.url).origin === location.origin;
  let isGETRequest = event.request.method === 'GET';
  let isHTMLRequest = event.request.headers.get('accept').indexOf('text/html') !== -1;
  
  event.respondWith(
    caches.match(event.request, {cacheName: ALL_CACHES.prefetch})
      .then((resp) => {
        if (resp) return resp; // Precache worked!
        return fetch(event.request)
          .then((resp) => {
            if (isApiCall)
              caches.open(ALL_CACHES.fallback).then((fallbackCache) => {
                fallbackCache.add(event.request.url);
              });
            return resp;
          })
          .catch(() => {
            // disconnected?
            if (isApiCall) {
              return caches.match(event.request, { cacheName: ALL_CACHES.fallback });
            } else if (isGETRequest && isHTMLRequest && isLocal) {
              return fetch(event.request).catch(() => caches.match(INDEX_HTML_URL));
            }
          });
      })
      .catch(() => {
        console.log('NOT responeded to ' + event.request.url + ' from cache');
        if (acceptHeader.indexOf('image/*') >= 0 && // if it's an image
            requestUrl.pathname.indexOf('/images/') === 0) { // and the url looks right
          return fetchImageOrFallback();
        } else {
          return fetch(event.request);
        }
      })
  );
});