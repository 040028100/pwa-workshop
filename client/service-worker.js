let counts = {
  install: 0,
  activate: 0,
  fetch: 0
}


self.addEventListener('install', event => {
  // Do the stuff needed at install time.
  // This may not be the active service worker yet.
  console.log('install count: ', ++counts.install);
});

self.addEventListener('activate', event => {
  // We are ready to take the stage.
  console.log('activate count: ', ++counts.activate);
});

self.addEventListener('fetch', event => {
  // Intercept a network request.
  console.log('fetch count: ', ++counts.fetch);
});