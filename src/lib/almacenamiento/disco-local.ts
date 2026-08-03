import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import type { AdaptadorAlmacenamiento } from "./tipos";

/**
 * Almacenamiento en el sistema de archivos. Para desarrollo local y para un
 * despliegue en VPS con volumen persistente.
 *
 * No sirve en Vercel: el sistema de archivos de las funciones es efímero.
 */
export function almacenamientoEnDisco(): AdaptadorAlmacenamiento {
  const raiz = resolve(process.env.ALMACENAMIENTO_RUTA ?? "./almacenamiento");

  /** Impide que una clave manipulada escape del directorio raíz. */
  const rutaAbsoluta = (clave: string) => {
    const destino = resolve(join(raiz, clave));
    if (!destino.startsWith(raiz)) throw new Error("Ruta de archivo inválida.");
    return destino;
  };

  return {
    nombre: "disco",

    async guardar(archivo, ruta) {
      const destino = rutaAbsoluta(ruta);
      await mkdir(dirname(destino), { recursive: true });
      const contenido = Buffer.from(await archivo.arrayBuffer());
      await writeFile(destino, contenido);
      return { clave: ruta, bytes: contenido.byteLength };
    },

    async leer(clave) {
      return readFile(rutaAbsoluta(clave));
    },

    async eliminar(clave) {
      await unlink(rutaAbsoluta(clave)).catch(() => undefined);
    },
  };
}
