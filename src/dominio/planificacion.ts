/**
 * Guía de planificación: qué se contrató en un proyecto y qué módulos habilita.
 *
 * El punto de todo esto: un proyecto de solo inspección técnica no debería
 * mostrarle al equipo el módulo de estados de pago. Los servicios contratados
 * dejan de ser documentación y pasan a decidir la interfaz.
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

/** Módulos que puede tener un proyecto. Crecen con las fases 4 a 6. */
export type ModuloProyecto =
  | "checklist"
  | "planificacion"
  | "estadosPago"
  | "notasCambio"
  | "rdi"
  | "protocolos"
  | "curva"
  | "informeSemanal";

/**
 * Servicios del catálogo que habilitan cada módulo.
 *
 * Se indexa por el `codigo` de la opción de catálogo, que es configurable: si
 * mañana se agrega un servicio nuevo, se agrega aquí su código y listo. Un
 * módulo sin servicios asociados está siempre disponible.
 */
const SERVICIOS_QUE_HABILITAN: Partial<Record<ModuloProyecto, string[]>> = {
  estadosPago: ["GERENCIAMIENTO", "ITO_ADMINISTRATIVA"],
  notasCambio: ["GERENCIAMIENTO", "ITO_ADMINISTRATIVA"],
  curva: ["GERENCIAMIENTO", "ITO_TECNICA", "ITO_ADMINISTRATIVA"],
  informeSemanal: ["GERENCIAMIENTO", "ITO_TECNICA", "ITO_ADMINISTRATIVA"],
};

/** Módulos que existen siempre, sin depender de lo contratado. */
const MODULOS_BASE: ModuloProyecto[] = ["checklist", "planificacion", "rdi", "protocolos"];

export interface ServicioDelProyecto {
  codigo: string;
  aplica: boolean;
}

/**
 * Módulos activos de un proyecto según sus servicios contratados.
 *
 * Un proyecto sin ningún servicio marcado conserva los módulos base: recién
 * creado, antes de llenar la guía de planificación, el equipo igual tiene que
 * poder trabajar el checklist.
 */
export function modulosActivos(servicios: ServicioDelProyecto[]): ModuloProyecto[] {
  const contratados = new Set(
    servicios.filter((servicio) => servicio.aplica).map((servicio) => servicio.codigo),
  );

  const activos = [...MODULOS_BASE];

  for (const [modulo, requeridos] of Object.entries(SERVICIOS_QUE_HABILITAN)) {
    if (requeridos.some((codigo) => contratados.has(codigo))) {
      activos.push(modulo as ModuloProyecto);
    }
  }

  return activos;
}

export function moduloEstaActivo(
  modulo: ModuloProyecto,
  servicios: ServicioDelProyecto[],
): boolean {
  return modulosActivos(servicios).includes(modulo);
}

/**
 * Iniciales de un profesional, como las pide la matriz de responsabilidades.
 *
 * Se derivan del nombre en vez de guardarse: un campo aparte se desincroniza en
 * cuanto alguien corrige un apellido mal escrito.
 */
export function inicialesDe(nombre: string, apellido?: string): string {
  const partes = `${nombre} ${apellido ?? ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return "";

  return partes
    .slice(0, 2)
    .map((parte) => parte[0]!.toLocaleUpperCase("es-CL"))
    .join("");
}

/**
 * ¿La guía de planificación está completa?
 *
 * Sirve para avisar en la interfaz, no para bloquear: un proyecto puede
 * arrancar en obra antes de que la guía esté cerrada, y bloquear el trabajo por
 * un formulario incompleto sería peor que el problema que resuelve.
 */
export function planificacionCompleta(datos: {
  servicios: ServicioDelProyecto[];
  tieneEquipo: boolean;
  tieneEnfoque: boolean;
  responsabilidadesSinAsignar: number;
}): boolean {
  return (
    datos.servicios.some((servicio) => servicio.aplica) &&
    datos.tieneEquipo &&
    datos.tieneEnfoque &&
    datos.responsabilidadesSinAsignar === 0
  );
}
