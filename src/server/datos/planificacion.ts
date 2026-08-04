import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/permisos";
import { inicialesDe, modulosActivos, planificacionCompleta } from "@/dominio/planificacion";
import { asegurarPlanificacionDelProyecto } from "@/server/servicios/clonar-planificacion";
import { filtroProyectos } from "./alcance";

/**
 * Guía de planificación de un proyecto.
 *
 * Como toda consulta de proyecto, arranca por `filtroProyectos`: si el usuario
 * no alcanza el proyecto, no alcanza su planificación.
 */

export type Planificacion = NonNullable<Awaited<ReturnType<typeof obtenerPlanificacion>>>;

export async function obtenerPlanificacion(usuario: UsuarioSesion, proyectoId: string) {
  const existe = await prisma.proyecto.count({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
  });
  if (existe === 0) return null;

  // Los proyectos creados antes de la Fase 3 no tienen guía: se completa al
  // entrar. Es idempotente, así que no pasa nada si ya la tenía.
  await asegurarPlanificacionDelProyecto(prisma, proyectoId);

  const proyecto = await prisma.proyecto.findUniqueOrThrow({
    where: { id: proyectoId },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      enfoqueServicio: true,
      servicios: {
        orderBy: { opcion: { orden: "asc" } },
        select: {
          id: true,
          aplica: true,
          fechaInicio: true,
          fechaTermino: true,
          comentario: true,
          opcion: { select: { id: true, codigo: true, etiqueta: true, activa: true } },
        },
      },
      responsabilidades: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          codigo: true,
          descripcion: true,
          aplica: true,
          requerimientoCliente: true,
          observaciones: true,
          responsableUsuarioId: true,
          responsableUsuario: { select: { id: true, nombre: true, apellido: true } },
          itemProyectoId: true,
          itemProyecto: { select: { id: true, codigo: true, descripcion: true } },
        },
      },
      asignaciones: {
        where: { activo: true },
        orderBy: { desde: "asc" },
        select: {
          id: true,
          rol: true,
          dedicacion: true,
          usuario: { select: { id: true, nombre: true, apellido: true, cargo: true } },
        },
      },
    },
  });

  const servicios = proyecto.servicios
    // Una opción desactivada en el catálogo se oculta si nadie la contrató;
    // si este proyecto sí la tiene marcada, se sigue mostrando: el contrato ya
    // se firmó y ocultarlo falsearía la guía.
    .filter((servicio) => servicio.opcion.activa || servicio.aplica)
    .map((servicio) => ({
      id: servicio.id,
      opcionId: servicio.opcion.id,
      codigo: servicio.opcion.codigo,
      etiqueta: servicio.opcion.etiqueta,
      aplica: servicio.aplica,
      fechaInicio: servicio.fechaInicio,
      fechaTermino: servicio.fechaTermino,
      comentario: servicio.comentario,
    }));

  const equipo = proyecto.asignaciones.map((asignacion) => ({
    id: asignacion.id,
    rol: asignacion.rol,
    dedicacion: asignacion.dedicacion,
    usuarioId: asignacion.usuario.id,
    nombre: `${asignacion.usuario.nombre} ${asignacion.usuario.apellido}`,
    cargo: asignacion.usuario.cargo,
    iniciales: inicialesDe(asignacion.usuario.nombre, asignacion.usuario.apellido),
  }));

  const responsabilidades = proyecto.responsabilidades.map((responsabilidad) => ({
    id: responsabilidad.id,
    codigo: responsabilidad.codigo,
    descripcion: responsabilidad.descripcion,
    aplica: responsabilidad.aplica,
    requerimientoCliente: responsabilidad.requerimientoCliente,
    observaciones: responsabilidad.observaciones,
    responsableUsuarioId: responsabilidad.responsableUsuarioId,
    responsableIniciales: responsabilidad.responsableUsuario
      ? inicialesDe(
          responsabilidad.responsableUsuario.nombre,
          responsabilidad.responsableUsuario.apellido,
        )
      : null,
    itemProyectoId: responsabilidad.itemProyectoId,
    itemProyecto: responsabilidad.itemProyecto,
  }));

  const sinAsignar = responsabilidades.filter(
    (responsabilidad) => responsabilidad.aplica && !responsabilidad.responsableUsuarioId,
  ).length;

  return {
    proyecto: {
      id: proyecto.id,
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      enfoqueServicio: proyecto.enfoqueServicio,
    },
    servicios,
    equipo,
    responsabilidades,
    resumen: {
      serviciosContratados: servicios.filter((servicio) => servicio.aplica).length,
      responsabilidadesAplicables: responsabilidades.filter((r) => r.aplica).length,
      responsabilidadesSinAsignar: sinAsignar,
      modulos: modulosActivos(servicios),
      completa: planificacionCompleta({
        servicios,
        tieneEquipo: equipo.length > 0,
        tieneEnfoque: Boolean(proyecto.enfoqueServicio?.trim()),
        responsabilidadesSinAsignar: sinAsignar,
      }),
    },
  };
}

/** Módulos activos de un proyecto. Lo usa el layout para armar las pestañas. */
export async function obtenerModulosDelProyecto(proyectoId: string) {
  const servicios = await prisma.servicioContratado.findMany({
    where: { proyectoId },
    select: { aplica: true, opcion: { select: { codigo: true } } },
  });

  return modulosActivos(
    servicios.map((servicio) => ({ codigo: servicio.opcion.codigo, aplica: servicio.aplica })),
  );
}

/** Ítems del checklist del proyecto, para enlazar cada responsabilidad con su registro. */
export async function obtenerItemsParaEnlazar(proyectoId: string) {
  const items = await prisma.itemProyecto.findMany({
    where: { categoriaProyecto: { proyectoId } },
    orderBy: [{ categoriaProyecto: { orden: "asc" } }, { orden: "asc" }],
    select: {
      id: true,
      codigo: true,
      descripcion: true,
      categoriaProyecto: { select: { nombre: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    etiqueta: `${item.codigo} — ${item.descripcion}`,
    categoria: item.categoriaProyecto.nombre,
  }));
}
