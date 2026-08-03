/**
 * Cálculo del porcentaje de cumplimiento.
 *
 * Reglas de negocio (docs/02-MODELO-DATOS.md#cálculo-de-cumplimiento):
 *  - Un ítem con `aplica = false` queda fuera del cálculo por completo.
 *  - Un ítem con `cumple = NA` queda fuera del denominador: no penaliza ni premia.
 *  - Un ítem `PENDIENTE` sí cuenta en el denominador y no en el numerador: mientras
 *    no se evalúe, es incumplimiento.
 *  - El porcentaje del proyecto se calcula sobre todos sus ítems, NO como promedio
 *    de los porcentajes de categoría (una categoría de 2 ítems no puede pesar lo
 *    mismo que una de 38).
 *  - `peso` permite ponderar ítems y categorías. En el MVP todos valen 1.
 *
 * Este módulo es lógica pura: no importa Prisma, React ni Next.
 */

export type EstadoCumple = "SI" | "NO" | "NA" | "PENDIENTE";

export interface ItemCalculable {
  aplica: boolean;
  cumple: EstadoCumple;
  peso?: number;
}

export interface ResultadoCumplimiento {
  /** Suma de pesos de los ítems que entran al cálculo. */
  itemsAplicables: number;
  /** Suma de pesos de los ítems con cumple = SI. */
  itemsCumplen: number;
  /** Porcentaje entre 0 y 100, con dos decimales. `null` si no hay ítems aplicables. */
  porcentaje: number | null;
}

/** Un ítem entra al cálculo solo si aplica al proyecto y no está marcado como N/A. */
export function entraAlCalculo(item: ItemCalculable): boolean {
  return item.aplica && item.cumple !== "NA";
}

export function calcularCumplimiento(items: ItemCalculable[]): ResultadoCumplimiento {
  let itemsAplicables = 0;
  let itemsCumplen = 0;

  for (const item of items) {
    if (!entraAlCalculo(item)) continue;
    const peso = item.peso ?? 1;
    itemsAplicables += peso;
    if (item.cumple === "SI") itemsCumplen += peso;
  }

  return {
    itemsAplicables,
    itemsCumplen,
    porcentaje: itemsAplicables === 0 ? null : redondear2((itemsCumplen / itemsAplicables) * 100),
  };
}

/**
 * Consolida el cumplimiento de un proyecto a partir de los resultados por categoría.
 * Suma numeradores y denominadores — no promedia porcentajes.
 */
export function consolidarCumplimiento(
  porCategoria: Pick<ResultadoCumplimiento, "itemsAplicables" | "itemsCumplen">[],
): ResultadoCumplimiento {
  const itemsAplicables = porCategoria.reduce((total, c) => total + c.itemsAplicables, 0);
  const itemsCumplen = porCategoria.reduce((total, c) => total + c.itemsCumplen, 0);

  return {
    itemsAplicables,
    itemsCumplen,
    porcentaje: itemsAplicables === 0 ? null : redondear2((itemsCumplen / itemsAplicables) * 100),
  };
}

export type NivelCumplimiento = "sin_datos" | "critico" | "bajo" | "aceptable" | "optimo";

/** Semáforo para la interfaz. El umbral bajo es configurable por la empresa. */
export function nivelCumplimiento(
  porcentaje: number | null,
  umbralBajo = 70,
): NivelCumplimiento {
  if (porcentaje === null) return "sin_datos";
  if (porcentaje < umbralBajo / 2) return "critico";
  if (porcentaje < umbralBajo) return "bajo";
  if (porcentaje < 95) return "aceptable";
  return "optimo";
}

export function formatearPorcentaje(porcentaje: number | null): string {
  if (porcentaje === null) return "—";
  return `${porcentaje.toLocaleString("es-CL", {
    minimumFractionDigits: porcentaje % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}
