/**
 * Etiquetas en español para las enumeraciones del dominio.
 * Un único lugar donde traducir los valores de base de datos a texto de interfaz.
 */

export const ETIQUETAS_ROL_GLOBAL = {
  ADMIN: "Administrador",
  SUBGERENTE: "Subgerente",
  JEFE_PROYECTO: "Jefe de Proyecto",
  ITO: "Inspector Técnico de Obras",
  CLIENTE: "Cliente (portal)",
} as const;

export const ETIQUETAS_ROL_PROYECTO = {
  ITO: "ITO",
  ITO_APOYO: "ITO de apoyo",
  JEFE_PROYECTO: "Jefe de Proyecto",
  SUBGERENTE: "Subgerente",
  OBSERVADOR: "Observador",
  CLIENTE_LECTOR: "Cliente (solo lectura)",
} as const;

export const ETIQUETAS_TIPO_CLIENTE = {
  INMOBILIARIA: "Inmobiliaria",
  CONSTRUCTORA: "Constructora",
  MANDANTE_PRIVADO: "Mandante privado",
  ORGANISMO_PUBLICO: "Organismo público",
  OTRO: "Otro",
} as const;

export const ETIQUETAS_ESTADO_PROYECTO = {
  PLANIFICACION: "En planificación",
  ACTIVO: "Activo",
  SUSPENDIDO: "Suspendido",
  EN_CIERRE: "En cierre",
  CERRADO: "Cerrado",
} as const;

export const ETIQUETAS_REQUISITO = {
  REQUERIDO: "Requerido",
  OPCIONAL: "Opcional",
  NO_APLICA: "No aplica",
} as const;

export const ETIQUETAS_CUMPLE = {
  SI: "Sí",
  NO: "No",
  NA: "N/A",
  PENDIENTE: "Pendiente",
} as const;

export const ETIQUETAS_SI_NO_NA = {
  SI: "Sí",
  NO: "No",
  NA: "N/A",
} as const;

export const ETIQUETAS_ESTADO_CICLO = {
  ABIERTO: "Abierto",
  EN_REVISION_JP: "En revisión — Jefe de Proyecto",
  EN_REVISION_SUBGERENCIA: "En revisión — Subgerencia",
  CERRADO: "Cerrado",
} as const;

export const ETIQUETAS_MONEDA = {
  CLP: "Pesos (CLP)",
  UF: "Unidad de Fomento (UF)",
  USD: "Dólares (USD)",
} as const;

/** Convierte un objeto de etiquetas en opciones para un <select>. */
export function aOpciones<T extends Record<string, string>>(
  etiquetas: T,
): { valor: keyof T & string; etiqueta: string }[] {
  return Object.entries(etiquetas).map(([valor, etiqueta]) => ({
    valor: valor as keyof T & string,
    etiqueta,
  }));
}
