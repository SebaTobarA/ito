"use server";

import { revalidatePath } from "next/cache";
import type { TipoCatalogo } from "@prisma/client";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaEspecialidad, esquemaOpcionCatalogo } from "@/lib/validaciones";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

/**
 * Administración de los catálogos configurables.
 *
 * Nada se borra: las opciones se desactivan. Una causa de no cumplimiento o un
 * servicio ya usado en un proyecto tiene que seguir existiendo para que el
 * histórico siga siendo legible — es la regla 5 aplicada a los catálogos.
 */

function revalidarCatalogos() {
  revalidatePath("/admin/catalogos");
  revalidatePath("/proyectos");
}

export async function guardarOpcionCatalogo(
  opcionId: string | null,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "catalogo.gestionar");

    const valores = esquemaOpcionCatalogo.parse(aObjeto(datos, ["activa"]));

    const opcion = opcionId
      ? await prisma.opcionCatalogo.update({
          where: { id: opcionId },
          // El tipo no se cambia: mover una opción de catálogo dejaría
          // referencias colgando en los proyectos que ya la usan.
          data: {
            codigo: valores.codigo,
            etiqueta: valores.etiqueta,
            orden: valores.orden,
            activa: valores.activa,
          },
        })
      : await prisma.opcionCatalogo.create({ data: valores });

    await registrarAuditoria({
      entidad: "OpcionCatalogo",
      entidadId: opcion.id,
      accion: opcionId ? "ACTUALIZAR" : "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { tipo: opcion.tipo, codigo: opcion.codigo, etiqueta: opcion.etiqueta },
    });

    revalidarCatalogos();
    return { ok: true, mensaje: `Opción "${opcion.etiqueta}" guardada.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/** Activa o desactiva una opción sin borrarla. */
export async function alternarOpcionCatalogo(
  opcionId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "catalogo.gestionar");

    const actual = await prisma.opcionCatalogo.findUnique({
      where: { id: opcionId },
      select: { activa: true, etiqueta: true },
    });
    if (!actual) return { error: "La opción no existe." };

    await prisma.opcionCatalogo.update({
      where: { id: opcionId },
      data: { activa: !actual.activa },
    });

    await registrarAuditoria({
      entidad: "OpcionCatalogo",
      entidadId: opcionId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      campo: "activa",
      valorAnterior: actual.activa,
      valorNuevo: !actual.activa,
    });

    revalidarCatalogos();
    return {
      ok: true,
      mensaje: actual.activa
        ? `"${actual.etiqueta}" ya no se ofrece en proyectos nuevos.`
        : `"${actual.etiqueta}" vuelve a estar disponible.`,
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function guardarEspecialidad(
  especialidadId: string | null,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "catalogo.gestionar");

    const valores = esquemaEspecialidad.parse(aObjeto(datos, ["activa"]));

    const especialidad = especialidadId
      ? await prisma.especialidad.update({ where: { id: especialidadId }, data: valores })
      : await prisma.especialidad.create({ data: valores });

    await registrarAuditoria({
      entidad: "Especialidad",
      entidadId: especialidad.id,
      accion: especialidadId ? "ACTUALIZAR" : "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { codigo: especialidad.codigo, nombre: especialidad.nombre },
    });

    revalidarCatalogos();
    return { ok: true, mensaje: `Especialidad "${especialidad.nombre}" guardada.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function alternarEspecialidad(
  especialidadId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "catalogo.gestionar");

    const actual = await prisma.especialidad.findUnique({
      where: { id: especialidadId },
      select: { activa: true, nombre: true },
    });
    if (!actual) return { error: "La especialidad no existe." };

    await prisma.especialidad.update({
      where: { id: especialidadId },
      data: { activa: !actual.activa },
    });

    revalidarCatalogos();
    return {
      ok: true,
      mensaje: actual.activa
        ? `"${actual.nombre}" desactivada.`
        : `"${actual.nombre}" reactivada.`,
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/** Tipos de catálogo válidos, para que el formulario no los invente. */
export async function tiposDeCatalogoDisponibles(): Promise<TipoCatalogo[]> {
  return [
    "TIPO_SERVICIO",
    "TIPO_PROYECTO",
    "ESTADO_DOCUMENTO",
    "CAUSA_NO_CUMPLIMIENTO",
    "CARGO_EQUIPO",
    "RECURSO_TERRENO",
  ];
}
