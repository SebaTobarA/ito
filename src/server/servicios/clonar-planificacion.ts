import type { Prisma, PrismaClient } from "@prisma/client";

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

/**
 * Prepara la guía de planificación de un proyecto recién creado.
 *
 * Igual que el checklist: la matriz de responsabilidades se **clona** desde la
 * plantilla, no se referencia. Editar la matriz maestra después no debe alterar
 * un proyecto en curso, porque la guía de planificación es un acuerdo con el
 * mandante y cambiarla a posteriori equivaldría a reescribir lo pactado.
 *
 * Los servicios se crean todos en `aplica = false`: el proyecto arranca sin
 * nada contratado y es la guía la que va marcando qué sí.
 */
export async function clonarPlanificacionEnProyecto(
  db: ClientePrisma,
  params: { proyectoId: string; plantillaId: string },
) {
  const [responsabilidades, servicios] = await Promise.all([
    db.responsabilidadPlantilla.findMany({
      where: { plantillaId: params.plantillaId, activa: true },
      orderBy: { orden: "asc" },
    }),
    db.opcionCatalogo.findMany({
      where: { tipo: "TIPO_SERVICIO", activa: true },
      orderBy: { orden: "asc" },
    }),
  ]);

  if (responsabilidades.length > 0) {
    await db.responsabilidadProyecto.createMany({
      data: responsabilidades.map((responsabilidad) => ({
        proyectoId: params.proyectoId,
        responsabilidadPlantillaId: responsabilidad.id,
        codigo: responsabilidad.codigo,
        descripcion: responsabilidad.descripcion,
        orden: responsabilidad.orden,
      })),
      skipDuplicates: true,
    });
  }

  if (servicios.length > 0) {
    await db.servicioContratado.createMany({
      data: servicios.map((servicio) => ({
        proyectoId: params.proyectoId,
        opcionId: servicio.id,
        aplica: false,
      })),
      skipDuplicates: true,
    });
  }

  return { responsabilidades: responsabilidades.length, servicios: servicios.length };
}

/**
 * Completa la planificación de proyectos creados antes de la Fase 3.
 *
 * Sin esto, un proyecto existente abriría la guía vacía y sin forma de
 * llenarla. Es idempotente gracias a `skipDuplicates`, así que se puede
 * invocar al entrar a la guía sin miedo a duplicar filas.
 */
export async function asegurarPlanificacionDelProyecto(
  db: ClientePrisma,
  proyectoId: string,
): Promise<void> {
  const [tieneResponsabilidades, tieneServicios] = await Promise.all([
    db.responsabilidadProyecto.count({ where: { proyectoId } }),
    db.servicioContratado.count({ where: { proyectoId } }),
  ]);
  if (tieneResponsabilidades > 0 && tieneServicios > 0) return;

  const proyecto = await db.proyecto.findUnique({
    where: { id: proyectoId },
    select: { plantillaOrigenId: true },
  });

  // Si el proyecto no registra plantilla de origen se usa la activa: es un
  // proyecto anterior al versionado y lo razonable es darle la metodología
  // vigente antes que dejarlo sin guía.
  const plantillaId =
    proyecto?.plantillaOrigenId ??
    (await db.plantillaChecklist.findFirst({ where: { esActiva: true }, select: { id: true } }))
      ?.id;

  if (!plantillaId) return;

  await clonarPlanificacionEnProyecto(db, { proyectoId, plantillaId });
}
