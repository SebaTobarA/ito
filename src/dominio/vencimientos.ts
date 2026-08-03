/**
 * Estado de boletas de garantía, pólizas de seguro y permisos.
 *
 * Un ítem del checklist puede tener varios vencimientos simultáneos con fechas
 * distintas (es lo habitual: fiel cumplimiento + anticipo + correcta ejecución),
 * por eso el vencimiento es una entidad propia y no un campo de fecha en el ítem.
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

import { diasEntre, hoyEnChile } from "./frecuencias";

export type TipoVencimiento =
  | "BOLETA_GARANTIA"
  | "POLIZA_SEGURO"
  | "PERMISO"
  | "CERTIFICADO"
  | "OTRO";

export type EstadoVencimiento = "VIGENTE" | "POR_VENCER" | "VENCIDO" | "RENOVADO" | "LIBERADO";

export const ETIQUETAS_TIPO_VENCIMIENTO: Record<TipoVencimiento, string> = {
  BOLETA_GARANTIA: "Boleta de garantía",
  POLIZA_SEGURO: "Póliza de seguro",
  PERMISO: "Permiso",
  CERTIFICADO: "Certificado",
  OTRO: "Otro",
};

export const ETIQUETAS_ESTADO_VENCIMIENTO: Record<EstadoVencimiento, string> = {
  VIGENTE: "Vigente",
  POR_VENCER: "Por vencer",
  VENCIDO: "Vencido",
  RENOVADO: "Renovado",
  LIBERADO: "Liberado",
};

/**
 * Estado calculado a partir de la fecha. Los estados RENOVADO y LIBERADO son
 * decisiones manuales del equipo y nunca se recalculan automáticamente.
 */
export function calcularEstadoVencimiento(params: {
  fechaVencimiento: Date;
  diasAlertaPrevia?: number;
  estadoActual?: EstadoVencimiento;
  hoy?: Date;
}): EstadoVencimiento {
  const { fechaVencimiento, estadoActual } = params;
  const diasAlertaPrevia = params.diasAlertaPrevia ?? 30;
  const hoy = params.hoy ?? hoyEnChile();

  if (estadoActual === "RENOVADO" || estadoActual === "LIBERADO") return estadoActual;

  const dias = diasEntre(hoy, fechaVencimiento);
  if (dias < 0) return "VENCIDO";
  if (dias <= diasAlertaPrevia) return "POR_VENCER";
  return "VIGENTE";
}

/** Días que faltan para el vencimiento. Negativo si ya venció. */
export function diasParaVencer(fechaVencimiento: Date, hoy: Date = hoyEnChile()): number {
  return diasEntre(hoy, fechaVencimiento);
}

export type SeveridadAlerta = "INFO" | "MEDIA" | "ALTA" | "CRITICA";

/**
 * Severidad de la alerta asociada a un vencimiento. Escala en función de qué tan
 * cerca está la fecha respecto de la ventana de aviso configurada.
 */
export function severidadPorVencimiento(
  fechaVencimiento: Date,
  diasAlertaPrevia = 30,
  hoy: Date = hoyEnChile(),
): SeveridadAlerta {
  const dias = diasParaVencer(fechaVencimiento, hoy);
  if (dias < 0) return "CRITICA";
  if (dias <= 7) return "CRITICA";
  if (dias <= Math.max(15, Math.round(diasAlertaPrevia / 2))) return "ALTA";
  if (dias <= diasAlertaPrevia) return "MEDIA";
  return "INFO";
}

export function describeVencimiento(fechaVencimiento: Date, hoy: Date = hoyEnChile()): string {
  const dias = diasParaVencer(fechaVencimiento, hoy);
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}
