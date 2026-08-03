"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaCategoriaPlantilla, esquemaItemPlantilla } from "@/lib/validaciones";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

const BOOLEANOS_CATEGORIA = ["activa"];
const BOOLEANOS_ITEM = [
  "controlaVencimiento",
  "aplicaPorDefecto",
  "visibleParaCliente",
  "activo",
];

// ------------------------------------------------------------- Categorías

export async function guardarCategoriaPlantilla(
  categoriaId: string | null,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "plantilla.gestionar");

    const valores = esquemaCategoriaPlantilla.parse(aObjeto(datos, BOOLEANOS_CATEGORIA));

    const categoria = categoriaId
      ? await prisma.categoriaPlantilla.update({ where: { id: categoriaId }, data: valores })
      : await prisma.categoriaPlantilla.create({ data: valores });

    await registrarAuditoria({
      entidad: "CategoriaPlantilla",
      entidadId: categoria.id,
      accion: categoriaId ? "ACTUALIZAR" : "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { codigo: categoria.codigo, nombre: categoria.nombre },
    });

    revalidatePath("/admin/plantillas");
    return { ok: true, mensaje: categoriaId ? "Categoría actualizada." : "Categoría creada." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

// ------------------------------------------------------------------ Ítems

export async function guardarItemPlantilla(
  itemId: string | null,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "plantilla.gestionar");

    const valores = esquemaItemPlantilla.parse(aObjeto(datos, BOOLEANOS_ITEM));

    const item = itemId
      ? await prisma.itemPlantilla.update({ where: { id: itemId }, data: valores })
      : await prisma.itemPlantilla.create({ data: valores });

    await registrarAuditoria({
      entidad: "ItemPlantilla",
      entidadId: item.id,
      accion: itemId ? "ACTUALIZAR" : "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { codigo: item.codigo, descripcion: item.descripcion },
    });

    revalidatePath("/admin/plantillas");
    return { ok: true, mensaje: itemId ? "Ítem actualizado." : "Ítem creado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function alternarItemPlantilla(itemId: string): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "plantilla.gestionar");

    const item = await prisma.itemPlantilla.findUniqueOrThrow({ where: { id: itemId } });
    await prisma.itemPlantilla.update({ where: { id: itemId }, data: { activo: !item.activo } });

    revalidatePath("/admin/plantillas");
    return { ok: true, mensaje: item.activo ? "Ítem desactivado." : "Ítem activado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

// -------------------------------------------------------------- Versiones

/**
 * Crea una versión nueva de la plantilla copiando la actual.
 *
 * Es lo que permite refinar la metodología sin alterar los proyectos ya creados:
 * cada proyecto conserva la copia que se le clonó al nacer.
 */
export async function crearVersionPlantilla(plantillaId: string): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "plantilla.gestionar");

    const origen = await prisma.plantillaChecklist.findUniqueOrThrow({
      where: { id: plantillaId },
      include: { categorias: { include: { items: true }, orderBy: { orden: "asc" } } },
    });

    const ultimaVersion = await prisma.plantillaChecklist.aggregate({ _max: { version: true } });
    const nuevaVersion = (ultimaVersion._max.version ?? 0) + 1;

    await prisma.$transaction(
      async (tx) => {
        const plantilla = await tx.plantillaChecklist.create({
          data: {
            nombre: origen.nombre,
            version: nuevaVersion,
            descripcion: origen.descripcion,
            esActiva: false,
          },
        });

        for (const categoria of origen.categorias) {
          const categoriaNueva = await tx.categoriaPlantilla.create({
            data: {
              plantillaId: plantilla.id,
              codigo: categoria.codigo,
              nombre: categoria.nombre,
              descripcion: categoria.descripcion,
              orden: categoria.orden,
              peso: categoria.peso,
              activa: categoria.activa,
            },
          });

          if (categoria.items.length === 0) continue;
          await tx.itemPlantilla.createMany({
            data: categoria.items.map((item) => ({
              categoriaId: categoriaNueva.id,
              codigo: item.codigo,
              descripcion: item.descripcion,
              codigoRegistro: item.codigoRegistro,
              subgrupo: item.subgrupo,
              instrucciones: item.instrucciones,
              frecuencia: item.frecuencia,
              responsableRol: item.responsableRol,
              revisorRol: item.revisorRol,
              requiereRespaldoDigital: item.requiereRespaldoDigital,
              requiereRespaldoFisico: item.requiereRespaldoFisico,
              controlaVencimiento: item.controlaVencimiento,
              aplicaPorDefecto: item.aplicaPorDefecto,
              visibleParaCliente: item.visibleParaCliente,
              formatoArchivoUrl: item.formatoArchivoUrl,
              orden: item.orden,
              peso: item.peso,
              activo: item.activo,
            })),
          });
        }

        return plantilla;
      },
      { timeout: 30_000 },
    );

    revalidatePath("/admin/plantillas");
    return { ok: true, mensaje: `Versión ${nuevaVersion} creada como borrador.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/** Publica una versión: pasa a ser la que se clona en los proyectos nuevos. */
export async function activarPlantilla(plantillaId: string): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "plantilla.gestionar");

    await prisma.$transaction([
      prisma.plantillaChecklist.updateMany({
        where: { esActiva: true },
        data: { esActiva: false },
      }),
      prisma.plantillaChecklist.update({
        where: { id: plantillaId },
        data: { esActiva: true, publicadaAt: new Date() },
      }),
    ]);

    await registrarAuditoria({
      entidad: "PlantillaChecklist",
      entidadId: plantillaId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      campo: "esActiva",
      valorNuevo: true,
    });

    revalidatePath("/admin/plantillas");
    return {
      ok: true,
      mensaje: "Plantilla publicada. Los proyectos nuevos se crearán con esta versión.",
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
