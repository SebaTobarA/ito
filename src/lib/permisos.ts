/**
 * Control de acceso basado en rol global + rol en el proyecto.
 *
 * Ningún componente ni acción debe leer `rolGlobal` directamente: todo pasa por
 * `puede(...)`. Eso es lo que permitirá habilitar el portal de cliente futuro
 * agregando el rol CLIENTE a esta matriz, sin tocar el resto de la aplicación.
 *
 * Matriz completa documentada en docs/02-MODELO-DATOS.md#permisos
 */

export type RolGlobal = "ADMIN" | "SUBGERENTE" | "JEFE_PROYECTO" | "ITO" | "CLIENTE";

export type RolProyecto =
  | "ITO"
  | "ITO_APOYO"
  | "JEFE_PROYECTO"
  | "SUBGERENTE"
  | "OBSERVADOR"
  | "CLIENTE_LECTOR";

export type Accion =
  // Clientes
  | "cliente.ver"
  | "cliente.crear"
  | "cliente.editar"
  | "cliente.eliminar"
  // Proyectos
  | "proyecto.ver"
  | "proyecto.crear"
  | "proyecto.editar"
  | "proyecto.eliminar"
  | "proyecto.asignarEquipo"
  // Checklist
  | "item.ver"
  | "item.editar"
  | "item.crear"
  | "item.marcarCumplimiento"
  // Documentos
  | "documento.ver"
  | "documento.subir"
  | "documento.eliminar"
  // Ciclos de revisión
  | "ciclo.ver"
  | "ciclo.crear"
  | "ciclo.aprobarJefatura"
  | "ciclo.aprobarSuperior"
  // Administración
  | "usuario.gestionar"
  | "plantilla.gestionar"
  | "empresa.configurar"
  | "auditoria.ver"
  | "reporte.exportar";

export interface UsuarioSesion {
  id: string;
  rolGlobal: RolGlobal;
  /** Solo poblado para el futuro rol CLIENTE. */
  clienteId?: string | null;
}

/**
 * Contexto del recurso sobre el que se evalúa la acción.
 * `rolesEnProyecto` son los roles que el usuario tiene asignados en ese proyecto.
 */
export interface ContextoRecurso {
  rolesEnProyecto?: RolProyecto[];
  /** Cliente dueño del proyecto o recurso, cuando aplica. */
  clienteId?: string | null;
}

/** Acciones permitidas a nivel global, sin necesidad de asignación al proyecto. */
const ACCIONES_POR_ROL_GLOBAL: Record<RolGlobal, Accion[] | "todas"> = {
  ADMIN: "todas",
  SUBGERENTE: [
    "cliente.ver",
    "proyecto.ver",
    "proyecto.crear",
    "proyecto.editar",
    "proyecto.asignarEquipo",
    "item.ver",
    "item.editar",
    "item.crear",
    "item.marcarCumplimiento",
    "documento.ver",
    "documento.subir",
    "documento.eliminar",
    "ciclo.ver",
    "ciclo.crear",
    "ciclo.aprobarJefatura",
    "ciclo.aprobarSuperior",
    "auditoria.ver",
    "reporte.exportar",
  ],
  JEFE_PROYECTO: [
    "cliente.ver",
    "proyecto.ver",
    "proyecto.editar",
    "item.ver",
    "item.editar",
    "item.crear",
    "item.marcarCumplimiento",
    "documento.ver",
    "documento.subir",
    "documento.eliminar",
    "ciclo.ver",
    "ciclo.crear",
    "ciclo.aprobarJefatura",
    "auditoria.ver",
    "reporte.exportar",
  ],
  ITO: [
    "cliente.ver",
    "proyecto.ver",
    "item.ver",
    "item.editar",
    "item.marcarCumplimiento",
    "documento.ver",
    "documento.subir",
    "ciclo.ver",
    "reporte.exportar",
  ],
  // PORTAL DE CLIENTE (aún sin uso): solo lectura, y solo de sus propios proyectos.
  CLIENTE: ["proyecto.ver", "item.ver", "documento.ver", "ciclo.ver", "reporte.exportar"],
};

/**
 * ¿El usuario puede ejecutar la acción sobre el recurso?
 *
 * Reglas:
 *  - ADMIN puede todo.
 *  - Los roles internos necesitan que la acción esté en su lista Y, para las
 *    acciones sobre un proyecto concreto, estar asignados a ese proyecto.
 *  - CLIENTE solo accede a proyectos de su propia empresa.
 */
export function puede(
  usuario: UsuarioSesion | null | undefined,
  accion: Accion,
  contexto: ContextoRecurso = {},
): boolean {
  if (!usuario) return false;

  const permitidas = ACCIONES_POR_ROL_GLOBAL[usuario.rolGlobal];
  if (permitidas === "todas") return true;
  if (!permitidas.includes(accion)) return false;

  if (usuario.rolGlobal === "CLIENTE") {
    if (!usuario.clienteId || !contexto.clienteId) return false;
    return usuario.clienteId === contexto.clienteId;
  }

  // Acciones sobre un proyecto concreto: requieren asignación activa.
  if (esAccionDeProyecto(accion) && contexto.rolesEnProyecto !== undefined) {
    if (contexto.rolesEnProyecto.length === 0) return false;
    if (accion === "ciclo.aprobarSuperior") {
      return contexto.rolesEnProyecto.includes("SUBGERENTE");
    }
    if (accion === "ciclo.aprobarJefatura") {
      return (
        contexto.rolesEnProyecto.includes("JEFE_PROYECTO") ||
        contexto.rolesEnProyecto.includes("SUBGERENTE")
      );
    }
    if (contexto.rolesEnProyecto.includes("OBSERVADOR") && !esAccionDeLectura(accion)) {
      return contexto.rolesEnProyecto.some((rol) => rol !== "OBSERVADOR");
    }
    if (contexto.rolesEnProyecto.includes("CLIENTE_LECTOR") && !esAccionDeLectura(accion)) {
      return contexto.rolesEnProyecto.some((rol) => rol !== "CLIENTE_LECTOR");
    }
  }

  return true;
}

/** Igual que `puede`, pero lanza. Para usar al inicio de una Server Action. */
export function exigir(
  usuario: UsuarioSesion | null | undefined,
  accion: Accion,
  contexto: ContextoRecurso = {},
): void {
  if (!puede(usuario, accion, contexto)) {
    throw new ErrorDePermiso(accion);
  }
}

export class ErrorDePermiso extends Error {
  constructor(public readonly accion: Accion) {
    super(`No tienes permiso para realizar esta acción (${accion}).`);
    this.name = "ErrorDePermiso";
  }
}

/** ¿El usuario ve todos los proyectos, o solo los que tiene asignados? */
export function veTodosLosProyectos(usuario: UsuarioSesion | null | undefined): boolean {
  return usuario?.rolGlobal === "ADMIN";
}

const ACCIONES_DE_PROYECTO: Accion[] = [
  "proyecto.ver",
  "proyecto.editar",
  "proyecto.eliminar",
  "proyecto.asignarEquipo",
  "item.ver",
  "item.editar",
  "item.crear",
  "item.marcarCumplimiento",
  "documento.ver",
  "documento.subir",
  "documento.eliminar",
  "ciclo.ver",
  "ciclo.crear",
  "ciclo.aprobarJefatura",
  "ciclo.aprobarSuperior",
  "reporte.exportar",
];

function esAccionDeProyecto(accion: Accion): boolean {
  return ACCIONES_DE_PROYECTO.includes(accion);
}

function esAccionDeLectura(accion: Accion): boolean {
  return accion.endsWith(".ver") || accion === "reporte.exportar";
}
