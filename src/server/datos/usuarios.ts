import { prisma } from "@/lib/prisma";

/**
 * Usuarios internos activos, agrupados según el rol que pueden ocupar en un
 * proyecto. Un Subgerente también puede figurar como Jefe de Proyecto, y un Jefe
 * de Proyecto puede actuar como ITO en obras chicas.
 */
export async function opcionesEquipo() {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, rolGlobal: { in: ["ADMIN", "SUBGERENTE", "JEFE_PROYECTO", "ITO"] } },
    orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
    select: { id: true, nombre: true, apellido: true, rolGlobal: true },
  });

  const aOpcion = (u: (typeof usuarios)[number]) => ({
    id: u.id,
    etiqueta: `${u.nombre} ${u.apellido}`,
  });

  return {
    itos: usuarios.map(aOpcion),
    jefes: usuarios
      .filter((u) => u.rolGlobal !== "ITO")
      .map(aOpcion),
    subgerentes: usuarios
      .filter((u) => u.rolGlobal === "ADMIN" || u.rolGlobal === "SUBGERENTE")
      .map(aOpcion),
  };
}

/** Devuelve el usuario asignado a un rol en un proyecto, si existe. */
export function usuarioConRol(
  asignaciones: { usuarioId: string; rol: string }[],
  rol: string,
): string | null {
  return asignaciones.find((a) => a.rol === rol)?.usuarioId ?? null;
}
