"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import {
  aObjeto,
  esquemaDedicacionEquipo,
  esquemaEnfoqueServicio,
  esquemaResponsabilidadProyecto,
  esquemaServicioContratado,
} from "@/lib/validaciones";
import { contextoProyecto } from "@/server/datos/alcance";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

/**
 * Mutaciones de la guía de planificación.
 *
 * Marcar un servicio como contratado no es un dato administrativo: decide qué
 * módulos se le muestran al equipo en ese proyecto, así que revalida también la
 * ficha para que las pestañas se actualicen.
 */

function revalidarPlanificacion(proyectoId: string) {
  revalidatePath(`/proyectos/${proyectoId}/planificacion`);
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath(`/proyectos/${proyectoId}/checklist`);
}

export async function actualizarServicioContratado(
  servicioId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();

    const servicio = await prisma.servicioContratado.findUnique({
      where: { id: servicioId },
      select: { id: true, proyectoId: true, opcion: { select: { etiqueta: true } } },
    });
    if (!servicio) return { error: "El servicio no existe." };

    const contexto = await contextoProyecto(usuario, servicio.proyectoId);
    if (!contexto) return { error: "No tienes acceso a este proyecto." };
    exigir(usuario, "planificacion.editar", contexto);

    const valores = esquemaServicioContratado.parse(
      aObjeto(datos, ["aplica"]),
    );

    await prisma.servicioContratado.update({ where: { id: servicioId }, data: valores });

    await registrarAuditoria({
      entidad: "ServicioContratado",
      entidadId: servicioId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      proyectoId: servicio.proyectoId,
      valorNuevo: { servicio: servicio.opcion.etiqueta, ...valores },
    });

    revalidarPlanificacion(servicio.proyectoId);
    return { ok: true };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarResponsabilidad(
  responsabilidadId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();

    const responsabilidad = await prisma.responsabilidadProyecto.findUnique({
      where: { id: responsabilidadId },
      select: { id: true, proyectoId: true, codigo: true },
    });
    if (!responsabilidad) return { error: "La responsabilidad no existe." };

    const contexto = await contextoProyecto(usuario, responsabilidad.proyectoId);
    if (!contexto) return { error: "No tienes acceso a este proyecto." };
    exigir(usuario, "planificacion.editar", contexto);

    const valores = esquemaResponsabilidadProyecto.parse(
      aObjeto(datos, ["aplica"]),
    );

    await prisma.responsabilidadProyecto.update({
      where: { id: responsabilidadId },
      data: valores,
    });

    await registrarAuditoria({
      entidad: "ResponsabilidadProyecto",
      entidadId: responsabilidadId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      proyectoId: responsabilidad.proyectoId,
      valorNuevo: { codigo: responsabilidad.codigo, ...valores },
    });

    revalidarPlanificacion(responsabilidad.proyectoId);
    return { ok: true };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarEnfoqueServicio(
  proyectoId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();

    const contexto = await contextoProyecto(usuario, proyectoId);
    if (!contexto) return { error: "El proyecto no existe o no tienes acceso." };
    exigir(usuario, "planificacion.editar", contexto);

    const valores = esquemaEnfoqueServicio.parse(aObjeto(datos));
    await prisma.proyecto.update({ where: { id: proyectoId }, data: valores });

    await registrarAuditoria({
      entidad: "Proyecto",
      entidadId: proyectoId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      proyectoId,
      campo: "enfoqueServicio",
    });

    revalidarPlanificacion(proyectoId);
    return { ok: true, mensaje: "Enfoque del servicio guardado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarDedicacion(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    const valores = esquemaDedicacionEquipo.parse(aObjeto(datos));

    const asignacion = await prisma.asignacionProyecto.findUnique({
      where: { id: valores.asignacionId },
      select: { proyectoId: true },
    });
    if (!asignacion) return { error: "La asignación no existe." };

    const contexto = await contextoProyecto(usuario, asignacion.proyectoId);
    if (!contexto) return { error: "No tienes acceso a este proyecto." };
    exigir(usuario, "planificacion.editar", contexto);

    await prisma.asignacionProyecto.update({
      where: { id: valores.asignacionId },
      data: { dedicacion: valores.dedicacion },
    });

    revalidarPlanificacion(asignacion.proyectoId);
    return { ok: true };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
