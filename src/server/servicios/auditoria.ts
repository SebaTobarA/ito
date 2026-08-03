import { prisma } from "@/lib/prisma";
import type { AccionAuditoria, Prisma } from "@prisma/client";

type ClientePrisma = Prisma.TransactionClient | typeof prisma;

export interface EntradaAuditoria {
  entidad: string;
  entidadId: string;
  accion: AccionAuditoria;
  usuarioId?: string | null;
  proyectoId?: string | null;
  campo?: string;
  valorAnterior?: unknown;
  valorNuevo?: unknown;
}

/**
 * Deja constancia de un cambio. Nunca debe hacer fallar la operación de negocio:
 * si el registro de auditoría falla, se anota en consola y se sigue.
 */
export async function registrarAuditoria(
  entrada: EntradaAuditoria,
  db: ClientePrisma = prisma,
): Promise<void> {
  try {
    await db.registroAuditoria.create({
      data: {
        entidad: entrada.entidad,
        entidadId: entrada.entidadId,
        accion: entrada.accion,
        usuarioId: entrada.usuarioId ?? null,
        proyectoId: entrada.proyectoId ?? null,
        campo: entrada.campo,
        valorAnterior: (entrada.valorAnterior ?? undefined) as Prisma.InputJsonValue | undefined,
        valorNuevo: (entrada.valorNuevo ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[auditoria] no se pudo registrar el cambio", error);
  }
}

/**
 * Compara dos objetos y devuelve solo los campos que cambiaron.
 * Útil para no guardar registros de auditoría con el objeto completo.
 */
export function camposModificados<T extends Record<string, unknown>>(
  anterior: T,
  nuevo: Partial<T>,
): { anterior: Partial<T>; nuevo: Partial<T> } {
  const cambiosAnterior: Partial<T> = {};
  const cambiosNuevo: Partial<T> = {};

  for (const clave of Object.keys(nuevo) as (keyof T)[]) {
    const valorNuevo = nuevo[clave];
    const valorAnterior = anterior[clave];
    if (normalizar(valorAnterior) !== normalizar(valorNuevo)) {
      cambiosAnterior[clave] = valorAnterior;
      cambiosNuevo[clave] = valorNuevo;
    }
  }

  return { anterior: cambiosAnterior, nuevo: cambiosNuevo };
}

function normalizar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}
