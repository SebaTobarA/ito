/**
 * Esquema propio de codificación de documentos.
 *
 * El formato es una plantilla de texto configurable desde /admin/empresa, para
 * que la codificación sea de la empresa y no herede la de nadie más.
 *
 *   Marcadores disponibles:
 *     {prefijo}      → sigla de la empresa (ej. "ITO", "GPI")
 *     {categoria}    → código de la categoría, rellenado a 2 dígitos ("05")
 *     {correlativo}  → correlativo del ítem dentro de la categoría ("16")
 *     {item}         → código completo del ítem tal cual ("5.16")
 *
 *   Ejemplos:
 *     "{prefijo}-{categoria}-{correlativo}"  →  ITO-05-16
 *     "{prefijo}.{item}"                     →  ITO.5.16
 *     "{prefijo}-PROT-{correlativo}"         →  ITO-PROT-16
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

export const FORMATO_CODIGO_POR_DEFECTO = "{prefijo}-{categoria}-{correlativo}";

export interface DatosCodigo {
  prefijo: string;
  codigoCategoria: string;
  codigoItem: string;
}

/**
 * Genera el código de registro de un ítem según el formato configurado.
 * Devuelve el formato con los marcadores reemplazados; los marcadores
 * desconocidos se dejan intactos para que el error sea visible y no silencioso.
 */
export function generarCodigoRegistro(
  formato: string,
  { prefijo, codigoCategoria, codigoItem }: DatosCodigo,
): string {
  const reemplazos: Record<string, string> = {
    prefijo: prefijo.trim(),
    categoria: rellenar(soloDigitos(codigoCategoria) || codigoCategoria, 2),
    correlativo: rellenar(correlativoDe(codigoItem), 2),
    item: codigoItem,
  };

  return formato.replace(/\{(\w+)\}/g, (original, marcador: string) =>
    marcador in reemplazos ? reemplazos[marcador] : original,
  );
}

/** Extrae el correlativo de un código de ítem: "5.16" → "16", "12" → "12". */
export function correlativoDe(codigoItem: string): string {
  const partes = codigoItem.split(".");
  return partes[partes.length - 1] ?? codigoItem;
}

/**
 * Siguiente código de ítem dentro de una categoría.
 * ["5.1", "5.2", "5.10"] en la categoría "05" → "5.11"
 */
export function siguienteCodigoItem(codigoCategoria: string, codigosExistentes: string[]): string {
  const base = String(Number(soloDigitos(codigoCategoria) || "0"));
  const maximo = codigosExistentes.reduce((mayor, codigo) => {
    const numero = Number(correlativoDe(codigo));
    return Number.isFinite(numero) && numero > mayor ? numero : mayor;
  }, 0);
  return `${base}.${maximo + 1}`;
}

/** Valida que un formato contenga al menos un marcador reconocido. */
export function formatoEsValido(formato: string): boolean {
  return /\{(prefijo|categoria|correlativo|item)\}/.test(formato);
}

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

function rellenar(texto: string, largo: number): string {
  return texto.padStart(largo, "0");
}
