/**
 * Reglas de los respaldos documentales: qué se acepta y cómo se presenta.
 *
 * Vive en `dominio/` y no en `lib/almacenamiento/` porque estas reglas las
 * necesitan tanto el servidor (para validar antes de guardar) como el navegador
 * (para avisar antes de subir). El módulo de almacenamiento importa `node:fs`,
 * así que no puede entrar a un componente cliente.
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

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

/**
 * Ruta donde se guarda un respaldo. Se agrupa por proyecto para que el
 * almacenamiento sea navegable y para poder ubicar todo lo de un proyecto junto.
 *
 * El nombre se normaliza: se le quitan tildes y todo lo que no sea alfanumérico,
 * porque la clave viaja a proveedores que no toleran cualquier carácter.
 */
export function rutaDeRespaldo(params: {
  proyectoId: string;
  itemProyectoId: string | null;
  nombreArchivo: string;
  ahora?: number;
}): string {
  const seguro = params.nombreArchivo
    .normalize("NFD")
    // Marcas diacríticas combinantes: "ó" descompuesta en "o" + acento.
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-120);

  const carpeta = params.itemProyectoId ?? "general";
  return `proyectos/${params.proyectoId}/${carpeta}/${params.ahora ?? Date.now()}-${seguro}`;
}
