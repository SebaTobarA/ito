import { prisma } from "@/lib/prisma";
import { generarCodigoRegistro } from "@/dominio/codificacion";
import { calcularProximoControl, type Frecuencia } from "@/dominio/frecuencias";
import type { Prisma } from "@prisma/client";

type ClientePrisma = Prisma.TransactionClient | typeof prisma;

export class ErrorSinPlantillaActiva extends Error {
  constructor() {
    super(
      "No hay una plantilla de checklist activa. Crea y publica una en Administración → Plantillas.",
    );
    this.name = "ErrorSinPlantillaActiva";
  }
}

/** Plantilla que se usará para los proyectos nuevos. */
export async function obtenerPlantillaActiva(db: ClientePrisma = prisma) {
  return db.plantillaChecklist.findFirst({
    where: { esActiva: true },
    orderBy: { version: "desc" },
  });
}

/**
 * Clona la plantilla maestra dentro de un proyecto recién creado.
 *
 * El proyecto queda con una copia independiente: editar la plantilla después no
 * altera los proyectos ya creados, y editar el checklist de un proyecto no altera
 * la plantilla ni a los demás proyectos.
 *
 * Solo se clonan categorías e ítems activos.
 */
export async function clonarPlantillaEnProyecto(
  params: {
    proyectoId: string;
    plantillaId: string;
    prefijoDocumentos: string;
    formatoCodigoRegistro: string;
    fechaInicioProyecto?: Date | null;
    fechaTerminoProyecto?: Date | null;
  },
  db: ClientePrisma = prisma,
) {
  const {
    proyectoId,
    plantillaId,
    prefijoDocumentos,
    formatoCodigoRegistro,
    fechaInicioProyecto,
    fechaTerminoProyecto,
  } = params;

  const categorias = await db.categoriaPlantilla.findMany({
    where: { plantillaId, activa: true },
    orderBy: { orden: "asc" },
    include: {
      items: { where: { activo: true }, orderBy: { orden: "asc" } },
    },
  });

  if (categorias.length === 0) {
    throw new Error("La plantilla seleccionada no tiene categorías activas.");
  }

  let itemsCreados = 0;

  for (const categoria of categorias) {
    const categoriaProyecto = await db.categoriaProyecto.create({
      data: {
        proyectoId,
        categoriaPlantillaId: categoria.id,
        codigo: categoria.codigo,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        orden: categoria.orden,
        peso: categoria.peso,
      },
    });

    if (categoria.items.length === 0) continue;

    await db.itemProyecto.createMany({
      data: categoria.items.map((item) => ({
        categoriaProyectoId: categoriaProyecto.id,
        itemPlantillaId: item.id,
        codigo: item.codigo,
        descripcion: item.descripcion,
        // Si el ítem no trae código propio, se genera con el esquema de la empresa.
        codigoRegistro:
          item.codigoRegistro ??
          generarCodigoRegistro(formatoCodigoRegistro, {
            prefijo: prefijoDocumentos,
            codigoCategoria: categoria.codigo,
            codigoItem: item.codigo,
          }),
        subgrupo: item.subgrupo,
        instrucciones: item.instrucciones,
        frecuencia: item.frecuencia,
        responsableRol: item.responsableRol,
        revisorRol: item.revisorRol,
        requiereRespaldoDigital: item.requiereRespaldoDigital,
        requiereRespaldoFisico: item.requiereRespaldoFisico,
        controlaVencimiento: item.controlaVencimiento,
        visibleParaCliente: item.visibleParaCliente,
        orden: item.orden,
        peso: item.peso,
        aplica: item.aplicaPorDefecto,
        fechaProximoControl: calcularProximoControl({
          frecuencia: item.frecuencia as Frecuencia,
          fechaInicioProyecto,
          fechaTerminoProyecto,
        }),
      })),
    });

    itemsCreados += categoria.items.length;
  }

  return { categoriasCreadas: categorias.length, itemsCreados };
}
