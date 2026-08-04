"use client";

import { useEffect } from "react";

/**
 * Registra el service worker que hace instalable la aplicación.
 *
 * Solo en producción: en desarrollo un service worker activo interfiere con la
 * recarga en caliente y confunde más de lo que ayuda.
 */
export function RegistroPwa() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[pwa] no se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
