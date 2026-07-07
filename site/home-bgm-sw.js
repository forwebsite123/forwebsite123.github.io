const BGM_CACHE_NAME = 'site-bgm-audio-v3';
const BGM_ASSETS = [
  '/audio/home-bgm-guqin-reflection-420788.mp3',
  '/audio/about-bgm-emotional-piano-documentary.mp3',
  '/audio/jianmu-bgm-guqin-reflection-420785.mp3',
  '/audio/drift-transition-spring-sunshine-21s.mp3'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(BGM_CACHE_NAME).then(function (cache) {
      return cache.addAll(BGM_ASSETS).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf('site-bgm-audio-') === 0 && key !== BGM_CACHE_NAME) {
          return caches.delete(key);
        }
        return Promise.resolve(false);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function shouldInjectHomeBgm(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();

  if (lower === '/' || lower.endsWith('/index') || lower.endsWith('/index.html')) return false;
  if (lower.endsWith('/about') || lower.endsWith('/about.html')) return false;
  if (lower.endsWith('/jianmu') || lower.endsWith('/jianmu.html')) return false;

  return true;
}

function isBgmAsset(pathname) {
  return BGM_ASSETS.indexOf(pathname) !== -1;
}

function makeRangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return Promise.resolve(response);

  return response.arrayBuffer().then(function (buffer) {
    const bytesPrefix = 'bytes=';
    if (range.indexOf(bytesPrefix) !== 0) return response;

    const parts = range.replace(bytesPrefix, '').split('-');
    const start = Number(parts[0]);
    const end = parts[1] ? Number(parts[1]) : buffer.byteLength - 1;
    const resolvedStart = Number.isFinite(start) ? start : 0;
    const resolvedEnd = Number.isFinite(end) ? Math.min(end, buffer.byteLength - 1) : buffer.byteLength - 1;

    if (resolvedStart > resolvedEnd || resolvedStart < 0 || resolvedEnd >= buffer.byteLength) {
      return new Response(null, {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: {
          'Content-Range': 'bytes */' + buffer.byteLength
        }
      });
    }

    const chunk = buffer.slice(resolvedStart, resolvedEnd + 1);
    const headers = new Headers(response.headers);
    headers.set('Content-Range', 'bytes ' + resolvedStart + '-' + resolvedEnd + '/' + buffer.byteLength);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(chunk.byteLength));

    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: headers
    });
  });
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isBgmAsset(url.pathname)) {
    event.respondWith(
      caches.open(BGM_CACHE_NAME).then(function (cache) {
        return cache.match(url.pathname).then(function (cached) {
          if (cached) return makeRangeResponse(request, cached.clone());
          return fetch(request).then(function (response) {
            if (response && response.ok && !request.headers.has('range')) cache.put(url.pathname, response.clone());
            return response;
          });
        });
      }).catch(function () {
        return fetch(request);
      })
    );
    return;
  }

  if (request.mode !== 'navigate') return;
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
