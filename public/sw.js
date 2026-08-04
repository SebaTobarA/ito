/*
 * Service worker mínimo: habilita la instalación de la aplicación en el celular
 * y nada más.
 *
 * NO cachea nada a propósito. Esta aplicación sirve páginas autenticadas y
 * distintas por usuario: un caché compartido podría mostrarle a un ITO el
 * proyecto de otro, o dejar datos de un cliente en el dispositivo después de
 * cerrar sesión. El modo offline con cola de sincronización está contemplado en
 * el diseño (docs/01) pero requiere resolver esto en serio, no un caché genérico.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // Limpia cachés de versiones anteriores del service worker, si las hubiera.
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  );
});

/*
 * El navegador exige un manejador de `fetch` para considerar la aplicación
 * instalable. Este deja pasar todo hacia la red sin intervenir.
 */
self.addEventListener("fetch", () => {});
