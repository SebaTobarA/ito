import { prisma } from "@/lib/prisma";
import {
  calcularCumplimiento,
  consolidarCumplimiento,
  type EstadoCumple,
} from "@/dominio/cumplimiento";
import type { Prisma } from "@prisma/client";

type ClientePrisma = Prisma.TransactionClient | typeof prisma;

/**
 * Recalcula el porcentaje de cumplimiento de todas las categorías de un proyecto
 * y el consolidado del proyecto, y cachea el resultado.
 *
 * Se invoca dentro de la misma transacción de cualquier mutación de ítem, para que
 * el porcentaje mostrado nunca quede desfasado respecto de los datos.
 */
export async function recalcularCumplimientoProyecto(
  proyectoId: string,
  db: ClientePrisma = prisma,
) {
  const categorias = await db.categoriaProyecto.findMany({
    where: { proyectoId },
    select: {
      id: true,
      aplica: true,
      items: { select: { aplica: true, cumple: true, peso: true } },
    },
  });

  const resultadosPorCategoria = [];

  for (const categoria of categorias) {
    // Una categoría marcada como "no aplica" queda completamente fuera del cálculo.
    const items = categoria.aplica
      ? categoria.items.map((item) => ({
          aplica: item.aplica,
          cumple: item.cumple as EstadoCumple,
          peso: item.peso,
        }))
      : [];

    const resultado = calcularCumplimiento(items);

    await db.categoriaProyecto.update({
      where: { id: categoria.id },
      data: {
        itemsAplicables: resultado.itemsAplicables,
        itemsCumplen: resultado.itemsCumplen,
        porcentajeCumplimiento: resultado.porcentaje,
      },
    });

    resultadosPorCategoria.push(resultado);
  }

  const total = consolidarCumplimiento(resultadosPorCategoria);

  await db.proyecto.update({
    where: { id: proyectoId },
    data: {
      itemsAplicables: total.itemsAplicables,
      itemsCumplen: total.itemsCumplen,
      porcentajeCumplimiento: total.porcentaje,
      cumplimientoActualizadoAt: new Date(),
    },
  });

  return total;
}
