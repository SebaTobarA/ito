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
 * Ruta donde se guarda un respaldo. Se agrupa por proyecto para que el bucket
 * sea navegable y para poder borrar un proyecto completo si alguna vez hiciera falta.
 */
export function rutaDeRespaldo(params: {
  proyectoId: string;
  itemProyectoId: string | null;
  nombreArchivo: string;
}): string {
  const seguro = params.nombreArchivo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-120);

  const carpeta = params.itemProyectoId ?? "general";
  return `proyectos/${params.proyectoId}/${carpeta}/${Date.now()}-${seguro}`;
}

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

export const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/csv",
  "text/plain",
];

export function tipoEsPermitido(mimeType: string): boolean {
  return TIPOS_PERMITIDOS.includes(mimeType);
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
