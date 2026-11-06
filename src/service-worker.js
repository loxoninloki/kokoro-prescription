/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// Activate a fully installed build even if an old tab is still open.
// Open pages keep their current state until the next navigation.
self.skipWaiting();
clientsClaim();

// CRA injects the matching HTML, JavaScript, CSS and bundled assets.
precacheAndRoute(self.__WB_MANIFEST);

const scope = new URL(self.registration.scope);
registerRoute(
  ({ request, url }) => request.mode === 'navigate' &&
    url.origin === scope.origin && url.pathname === scope.pathname,
  createHandlerBoundToURL(new URL('index.html', scope).href)
);

registerRoute(
  ({ request, url }) => request.destination === 'image' &&
    url.origin === scope.origin && url.pathname.startsWith(scope.pathname),
  new StaleWhileRevalidate({
    cacheName: `kokoro-art-v1:${scope.pathname}`,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response.ok && response.headers.get('content-type')?.startsWith('image/') ? response : null,
      },
      new ExpirationPlugin({ maxEntries: 50 }),
    ],
  })
);
