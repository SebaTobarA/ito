import { del, head, put } from "@vercel/blob";

import type { AdaptadorAlmacenamiento } from "./tipos";

/**
 * Almacenamiento en Vercel Blob.
 *
 * Los blobs se crean con acceso público a nivel de proveedor (Vercel Blob no
 * ofrece otra cosa), pero la URL contiene un identificador aleatorio y **nunca
 * se entrega al navegador**: la aplicación sirve los archivos por
 * /api/archivos/[id], que verifica permisos antes de leer. La clave guardada en
 * la base de datos es la URL del blob.
 */
export function almacenamientoEnBlob(): AdaptadorAlmacenamiento {
  return {
    nombre: "blob",

    async guardar(archivo, ruta) {
      const resultado = await put(ruta, archivo, {
        access: "public",
        addRandomSuffix: true,
        contentType: archivo.type || "application/octet-stream",
      });
      return { clave: resultado.url, bytes: archivo.size };
    },

    async leer(clave) {
      // `head` valida que el blob exista y pertenezca al store antes de descargarlo.
      await head(clave);
      const respuesta = await fetch(clave);
      if (!respuesta.ok || !respuesta.body) {
        throw new Error(`No se pudo leer el archivo (${respuesta.status}).`);
      }
      return respuesta.body;
    },

    async eliminar(clave) {
      await del(clave);
    },
  };
}
