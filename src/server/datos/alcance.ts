import { prisma } from "@/lib/prisma";
import { veTodosLosProyectos, type RolProyecto, type UsuarioSesion } from "@/lib/permisos";
import type { Prisma } from "@prisma/client";

/**
 * Filtro de alcance: qué proyectos puede ver cada usuario.
 *
 * TODA consulta de proyectos debe pasar por aquí. Es el punto único que hace
 * seguro el portal de cliente futuro: cuando exista el rol CLIENTE, un mandante
 * solo verá los proyectos de su propia empresa sin que haya que auditar cada
 * consulta de la aplicación una por una.
 */
export function filtroProyectos(usuario: UsuarioSesion): Prisma.ProyectoWhereInput {
  if (veTodosLosProyectos(usuario)) return {};

  // PORTAL DE CLIENTE: acotado a los proyectos de su empresa.
  if (usuario.rolGlobal === "CLIENTE") {
    if (!usuario.clienteId) return { id: "__sin_acceso__" };
    return {
      clienteId: usuario.clienteId,
      asignaciones: { some: { usuarioId: usuario.id, activo: true } },
    };
  }

  // Roles internos: solo los proyectos donde tienen una asignación activa.
  return { asignaciones: { some: { usuarioId: usuario.id, activo: true } } };
}

/** Filtro equivalente para clientes: solo los que tienen algún proyecto visible. */
export function filtroClientes(usuario: UsuarioSesion): Prisma.ClienteWhereInput {
  if (veTodosLosProyectos(usuario)) return {};
  if (usuario.rolGlobal === "CLIENTE") {
    return usuario.clienteId ? { id: usuario.clienteId } : { id: "__sin_acceso__" };
  }
  return { proyectos: { some: filtroProyectos(usuario) } };
}

/** Roles que el usuario tiene asignados en un proyecto (vacío si no participa). */
export async function rolesEnProyecto(
  usuarioId: string,
  proyectoId: string,
): Promise<RolProyecto[]> {
  const asignaciones = await prisma.asignacionProyecto.findMany({
    where: { usuarioId, proyectoId, activo: true },
    select: { rol: true },
  });
  return asignaciones.map((a) => a.rol as RolProyecto);
}

/**
 * Contexto de permisos para un proyecto: sus roles y el cliente dueño.
 * Devuelve `null` si el proyecto no existe.
 */
export async function contextoProyecto(usuario: UsuarioSesion, proyectoId: string) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { id: true, clienteId: true },
  });
  if (!proyecto) return null;

  return {
    clienteId: proyecto.clienteId,
    rolesEnProyecto: await rolesEnProyecto(usuario.id, proyectoId),
  };
}

/** ¿El usuario puede acceder a este proyecto? */
export async function puedeAccederAlProyecto(
  usuario: UsuarioSesion,
  proyectoId: string,
): Promise<boolean> {
  if (veTodosLosProyectos(usuario)) {
    const existe = await prisma.proyecto.count({ where: { id: proyectoId } });
    return existe > 0;
  }
  const cuenta = await prisma.proyecto.count({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
  });
  return cuenta > 0;
}
