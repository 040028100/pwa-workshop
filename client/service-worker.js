import {
  ALL_CACHES, ALL_CACHES_LIST,
  removeUnusedCaches,
  precacheStaticAssets
} from './sw/caches';

import idb from 'idb';

const FALLBACK_IMAGE_URL = 'https://localhost:3100/images/fallback-grocery.png';
const FALLBACK_IMAGE_URLS = [
  'https://localhost:3100/images/fallback-grocery.png',
  'https://localhost:3100/images/fallback-bakery.png',
  'https://localhost:3100/images/fallback-dairy.png',
  'https://localhost:3100/images/fallback-frozen.png',
  'https://localhost:3100/images/fallback-fruit.png',
  'https://localhost:3100/images/fallback-herbs.png',
  'https://localhost:3100/images/fallback-meat.png',
  'https://localhost:3100/images/fallback-vegetables.png',
]
const INDEX_HTML_PATH = '/';
const INDEX_HTML_URL = new URL(INDEX_HTML_PATH, self.location).toString();

function groceryDb() {
  return idb.open('groceryitem-store', 2, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    switch (upgradeDB.oldVersion) {
    case 0: upgradeDB.createObjectStore('grocery-items', {keyPath: 'id'});
    }
  });
}

function downloadGroceryItems() {
  return groceryDb().then((db) => {
    return fetch('https://localhost:3100/api/grocery/items?limit=99999')
      .then((response) => response.json())
      .then(({data: items}) => {
        const tx = db.transaction('grocery-items', 'readwrite');
        tx.objectStore('grocery-items').clear();
        return tx.complete.then(() => {
          return Promise.all(items.map((groceryItem) => {
            const tx = db.transaction('grocery-items', 'readwrite');
            tx.objectStore('grocery-items').put(groceryItem);
            return tx.complete;
          }));
        });        
      });
  });
}

self.addEventListener('install', event => {
  // Do the stuff needed at install time.
  // This may not be the active service worker yet.
  event.waitUntil(
    Promise.all([
      caches.open(ALL_CACHES.fallbackImages).then((cache) => {
        cache.addAll(FALLBACK_IMAGE_URLS);
      }),
      precacheStaticAssets(),
      downloadGroceryItems()
    ])
  );
});

self.addEventListener('activate', event => {
  // We are ready to take the stage.
  event.waitUntil(removeUnusedCaches(ALL_CACHES_LIST));
});

function fallbackImageForRequest(request) {
  
  let path = new URL(request.url).pathname;
  let itemId = parseInt(path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')), 10);
  console.log(itemId);
  return groceryDb()
    .then((db) => {
      return db.transaction('grocery-items')
        .objectStore('grocery-items').get(itemId);
    })
    .then((item) => {
      let { category } = item;
      return caches.match(`https://localhost:3100/images/fallback-${category.toLowerCase()}.png`, {cacheName: ALL_CACHES.fallbackImages})
    });
}

function fetchImageOrFallback(fetchEvent) {
  return fetch(fetchEvent.request, {
    mode: 'cors'
  }).then((response) => {
    if (!response.ok) {
      return fallbackImageForRequest(fetchEvent.request);
    } else return response;
  }).catch(() => {
    return fallbackImageForRequest(fetchEvent.request);
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
  let isImage = acceptHeader.indexOf('image/*') >= 0 && // if it's an image
            requestUrl.pathname.indexOf('/images/') === 0;
  event.respondWith(
    caches.match(event.request, {cacheName: ALL_CACHES.prefetch})
      .then((resp) => {
        if (resp) return resp; // Precache worked!
        if (isImage) { // and the url looks right
          return fetchImageOrFallback(event);
        } else {
          return fetch(event.request)
            .then((resp) => {
              if (isApiCall && !isImage)
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
              } else {
                
              }
            });
        }
      })
      .catch(() => {
        console.log('NOT responeded to ' + event.request.url + ' from cache');
        if (isImage) { // and the url looks right
          return fetchImageOrFallback(event);
        } else {
          return fetch(event.request);
        }
      })
  );
});