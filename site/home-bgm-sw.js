self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function shouldInjectHomeBgm(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();

  if (lower === '/' || lower.endsWith('/index') || lower.endsWith('/index.html')) return false;
  if (lower.endsWith('/about') || lower.endsWith('/about.html')) return false;
  if (lower.endsWith('/jianmu') || lower.endsWith('/jianmu.html')) return false;

  return true;
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.mode !== 'navigate') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!shouldInjectHomeBgm(url.pathname)) return;

  event.respondWith(
    fetch(request).then(function (response) {
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('text/html')) return response;

      return response.text().then(function (html) {
        if (html.includes('home-bgm.js') || !html.includes('</body>')) {
          return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        const injected = html.replace('</body>', '<script src="/home-bgm.js"></script></body>');
        const headers = new Headers(response.headers);
        headers.delete('content-length');

        return new Response(injected, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
      });
    }).catch(function () {
      return fetch(request);
    })
  );
});
