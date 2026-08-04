/**
 * Almacenamiento de respaldos documentales.
 *
 * La aplicación nunca habla directamente con un proveedor: todo pasa por este
 * adaptador. Cambiar de Vercel Blob a Cloudflare R2, a S3 o a disco local es una
 * variable de entorno, no un cambio de código.
 *
 * Los archivos NUNCA son públicos: se sirven a través de /api/archivos/[id],
 * que verifica permisos antes de entregar el contenido.
 */

import type { AdaptadorAlmacenamiento } from "./tipos";
import { almacenamientoEnDisco } from "./disco-local";
import { almacenamientoEnBlob } from "./vercel-blob";

export type { AdaptadorAlmacenamiento, ArchivoGuardado } from "./tipos";

let adaptador: AdaptadorAlmacenamiento | null = null;

export function almacenamiento(): AdaptadorAlmacenamiento {
  if (adaptador) return adaptador;

  const elegido = (process.env.ALMACENAMIENTO ?? "disco").toLowerCase();
  adaptador = elegido === "blob" ? almacenamientoEnBlob() : almacenamientoEnDisco();
  return adaptador;
}

/**
 * Las reglas de tamaño, tipo y ruta viven en `dominio/archivos.ts`: las comparte
 * el navegador, que no puede importar este módulo porque usa `node:fs`.
 * Se reexportan para que el servidor tenga un único punto de entrada.
 */
export {
  formatearTamano,
  rutaDeRespaldo,
  TAMANO_MAXIMO_BYTES,
  TIPOS_PERMITIDOS,
  tipoEsPermitido,
} from "@/dominio/archivos";
