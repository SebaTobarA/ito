/**
 * Frecuencias de control de los ítems del checklist y cálculo de la próxima
 * fecha en que un registro debe volver a producirse.
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

export type Frecuencia =
  | "INICIO_PROYECTO"
  | "DIARIA"
  | "SEMANAL"
  | "QUINCENAL"
  | "MENSUAL"
  | "TRIMESTRAL"
  | "SEGUN_REQUERIMIENTO"
  | "POR_EVENTO"
  | "PERMANENTE"
  | "FINAL_PROYECTO";

export const ETIQUETAS_FRECUENCIA: Record<Frecuencia, string> = {
  INICIO_PROYECTO: "Inicio de proyecto",
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEGUN_REQUERIMIENTO: "Según requerimiento",
  POR_EVENTO: "Por evento",
  PERMANENTE: "Permanente",
  FINAL_PROYECTO: "Final del proyecto",
};

/** Abreviaturas para las vistas compactas y los reportes. */
export const ABREVIATURAS_FRECUENCIA: Record<Frecuencia, string> = {
  INICIO_PROYECTO: "INI",
  DIARIA: "DIA",
  SEMANAL: "SEM",
  QUINCENAL: "QUI",
  MENSUAL: "MEN",
  TRIMESTRAL: "TRI",
  SEGUN_REQUERIMIENTO: "SR",
  POR_EVENTO: "EVE",
  PERMANENTE: "PERM",
  FINAL_PROYECTO: "FIN",
};

/** Días entre controles. `null` = no tiene periodicidad automática. */
const DIAS_POR_FRECUENCIA: Record<Frecuencia, number | null> = {
  INICIO_PROYECTO: null,
  DIARIA: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
  TRIMESTRAL: 90,
  SEGUN_REQUERIMIENTO: null,
  POR_EVENTO: null,
  PERMANENTE: null,
  FINAL_PROYECTO: null,
};

export function esPeriodica(frecuencia: Frecuencia): boolean {
  return DIAS_POR_FRECUENCIA[frecuencia] !== null;
}

/**
 * Próxima fecha de control de un ítem.
 *
 * - Frecuencias periódicas: último control + su periodicidad. Si nunca se ha
 *   controlado, se cuenta desde el inicio del proyecto (o desde hoy si no hay).
 * - INICIO_PROYECTO: vence en la fecha de inicio del proyecto.
 * - FINAL_PROYECTO: vence en la fecha de término estimada.
 * - Las demás no generan vencimiento automático.
 */
export function calcularProximoControl(params: {
  frecuencia: Frecuencia;
  fechaUltimoControl?: Date | null;
  fechaInicioProyecto?: Date | null;
  fechaTerminoProyecto?: Date | null;
  hoy?: Date;
}): Date | null {
  const { frecuencia, fechaUltimoControl, fechaInicioProyecto, fechaTerminoProyecto } = params;
  const hoy = params.hoy ?? hoyEnChile();

  if (frecuencia === "INICIO_PROYECTO") return fechaInicioProyecto ?? null;
  if (frecuencia === "FINAL_PROYECTO") return fechaTerminoProyecto ?? null;

  const dias = DIAS_POR_FRECUENCIA[frecuencia];
  if (dias === null) return null;

  const base = fechaUltimoControl ?? fechaInicioProyecto ?? hoy;
  return sumarDias(base, dias);
}

export type EstadoControl = "sin_plazo" | "al_dia" | "proximo" | "atrasado";

/**
 * Estado de un ítem respecto de su próximo control.
 * `diasAviso` define cuántos días antes se considera "próximo".
 */
export function estadoControl(
  fechaProximoControl: Date | null | undefined,
  hoy: Date = hoyEnChile(),
  diasAviso = 7,
): EstadoControl {
  if (!fechaProximoControl) return "sin_plazo";
  const dias = diasEntre(hoy, fechaProximoControl);
  if (dias < 0) return "atrasado";
  if (dias <= diasAviso) return "proximo";
  return "al_dia";
}

export const ZONA_HORARIA = "America/Santiago";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Convención de fechas del sistema.
 *
 * Todas las fechas "de calendario" (vencimientos, inicio y término de obra,
 * fechas de control) se guardan como medianoche UTC: es lo que envía un
 * `<input type="date">` y lo que Prisma persiste. Por eso toda la aritmética de
 * este módulo usa los componentes UTC de la fecha.
 *
 * El único valor que NO es una fecha de calendario es "ahora": es un instante.
 * Para compararlo hay que traducirlo primero al día del calendario chileno —
 * si no, entre las 20:00 y la medianoche en Chile el sistema ya estaría contando
 * el día siguiente y las alertas se adelantarían un día.
 */
export function hoyEnChile(instante: Date = new Date()): Date {
  const [anio, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(instante)
    .split("-")
    .map(Number);

  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Días calendario entre dos fechas, ignorando la hora. Negativo si `hasta` ya pasó. */
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((aDiaUtc(hasta).getTime() - aDiaUtc(desde).getTime()) / MS_POR_DIA);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = aDiaUtc(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function aDiaUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}
