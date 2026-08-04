import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/permisos";
import { filtroProyectos } from "./alcance";

/**
 * Consultas del checklist de un proyecto.
 *
 * Toda consulta arranca verificando el proyecto contra `filtroProyectos`: si el
 * usuario no alcanza el proyecto, no alcanza ninguno de sus ítems ni de sus
 * documentos. Es el único punto por donde se entra a estos datos.
 */

export interface FiltrosChecklist {
  busqueda?: string;
  categoriaId?: string;
  cumple?: "SI" | "NO" | "NA" | "PENDIENTE";
  responsableUsuarioId?: string;
  soloPendientes?: boolean;
}

/** ¿El filtro descarta algún ítem, o estamos viendo el checklist completo? */
export function hayFiltrosActivos(filtros: FiltrosChecklist): boolean {
  return Boolean(
    filtros.busqueda ||
      filtros.categoriaId ||
      filtros.cumple ||
      filtros.responsableUsuarioId ||
      filtros.soloPendientes,
  );
}

function condicionesDeItem(filtros: FiltrosChecklist): Prisma.ItemProyectoWhereInput {
  const condiciones: Prisma.ItemProyectoWhereInput[] = [];

  if (filtros.busqueda) {
    const texto = filtros.busqueda.trim();
    condiciones.push({
      OR: [
        { descripcion: { contains: texto, mode: "insensitive" } },
        { codigo: { contains: texto, mode: "insensitive" } },
        { codigoRegistro: { contains: texto, mode: "insensitive" } },
        { subgrupo: { contains: texto, mode: "insensitive" } },
        { observaciones: { contains: texto, mode: "insensitive" } },
      ],
    });
  }

  if (filtros.cumple) condiciones.push({ cumple: filtros.cumple });

  // "Solo pendientes" mira lo que falta trabajar: un ítem que no aplica no está
  // pendiente de nada, aunque su estado de cumplimiento sea PENDIENTE.
  if (filtros.soloPendientes) condiciones.push({ aplica: true, cumple: "PENDIENTE" });

  if (filtros.responsableUsuarioId) {
    condiciones.push({ responsableUsuarioId: filtros.responsableUsuarioId });
  }

  return condiciones.length > 0 ? { AND: condiciones } : {};
}

export type ChecklistDeProyecto = NonNullable<Awaited<ReturnType<typeof obtenerChecklist>>>;
export type CategoriaChecklist = ChecklistDeProyecto["categorias"][number];
export type ItemChecklist = CategoriaChecklist["items"][number];

export async function obtenerChecklist(
  usuario: UsuarioSesion,
  proyectoId: string,
  filtros: FiltrosChecklist = {},
) {
  const proyecto = await prisma.proyecto.findFirst({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      fechaInicio: true,
      fechaTerminoEstimada: true,
      porcentajeCumplimiento: true,
      itemsAplicables: true,
      itemsCumplen: true,
      cliente: { select: { id: true, nombre: true } },
    },
  });
  if (!proyecto) return null;

  const categorias = await prisma.categoriaProyecto.findMany({
    where: {
      proyectoId,
      ...(filtros.categoriaId ? { id: filtros.categoriaId } : {}),
    },
    orderBy: { orden: "asc" },
    include: {
      _count: { select: { items: true } },
      items: {
        where: condicionesDeItem(filtros),
        orderBy: [{ orden: "asc" }, { codigo: "asc" }],
        include: {
          responsableUsuario: { select: { id: true, nombre: true, apellido: true } },
          _count: {
            select: { documentos: { where: { eliminadoAt: null, esVersionActual: true } } },
          },
        },
      },
    },
  });

  return {
    proyecto: {
      ...proyecto,
      porcentajeCumplimiento: aNumero(proyecto.porcentajeCumplimiento),
    },
    categorias: categorias.map((categoria) => ({
      id: categoria.id,
      codigo: categoria.codigo,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      orden: categoria.orden,
      aplica: categoria.aplica,
      porcentajeCumplimiento: aNumero(categoria.porcentajeCumplimiento),
      itemsAplicables: categoria.itemsAplicables,
      itemsCumplen: categoria.itemsCumplen,
      /** Total sin filtrar: permite mostrar "3 de 38" cuando hay una búsqueda activa. */
      totalItems: categoria._count.items,
      items: categoria.items.map((item) => ({
        id: item.id,
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
        esAdHoc: item.itemPlantillaId === null,
        aplica: item.aplica,
        cumple: item.cumple,
        respaldoDigital: item.respaldoDigital,
        respaldoFisico: item.respaldoFisico,
        observaciones: item.observaciones,
        responsableUsuarioId: item.responsableUsuarioId,
        responsableUsuario: item.responsableUsuario,
        fechaUltimoControl: item.fechaUltimoControl,
        fechaProximoControl: item.fechaProximoControl,
        totalDocumentos: item._count.documentos,
      })),
    })),
  };
}

/**
 * Ítem con el proyecto al que pertenece, verificando el alcance del usuario.
 * Devuelve `null` tanto si el ítem no existe como si el usuario no lo alcanza:
 * desde fuera, ambos casos son indistinguibles a propósito.
 */
export async function obtenerItemEnAlcance(usuario: UsuarioSesion, itemProyectoId: string) {
  const item = await prisma.itemProyecto.findFirst({
    where: {
      id: itemProyectoId,
      categoriaProyecto: { proyecto: filtroProyectos(usuario) },
    },
    include: {
      categoriaProyecto: {
        select: {
          id: true,
          proyectoId: true,
          proyecto: {
            select: { id: true, clienteId: true, fechaInicio: true, fechaTerminoEstimada: true },
          },
        },
      },
    },
  });
  if (!item) return null;

  return { item, proyecto: item.categoriaProyecto.proyecto };
}

/** Categoría con su proyecto, verificando el alcance. Para las acciones masivas. */
export async function obtenerCategoriaEnAlcance(
  usuario: UsuarioSesion,
  categoriaProyectoId: string,
) {
  const categoria = await prisma.categoriaProyecto.findFirst({
    where: { id: categoriaProyectoId, proyecto: filtroProyectos(usuario) },
    include: {
      proyecto: {
        select: { id: true, clienteId: true, fechaInicio: true, fechaTerminoEstimada: true },
      },
    },
  });
  if (!categoria) return null;

  return { categoria, proyecto: categoria.proyecto };
}

/** Equipo activo del proyecto, para los selectores de responsable. */
export async function obtenerEquipoProyecto(usuario: UsuarioSesion, proyectoId: string) {
  const asignaciones = await prisma.asignacionProyecto.findMany({
    where: {
      activo: true,
      proyecto: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
      usuario: { activo: true },
    },
    select: {
      rol: true,
      usuario: { select: { id: true, nombre: true, apellido: true } },
    },
    orderBy: { desde: "asc" },
  });

  // Un usuario puede tener más de un rol en el proyecto; en el selector va una vez.
  const porUsuario = new Map<string, { id: string; nombre: string; roles: string[] }>();
  for (const asignacion of asignaciones) {
    const actual = porUsuario.get(asignacion.usuario.id);
    if (actual) {
      actual.roles.push(asignacion.rol);
      continue;
    }
    porUsuario.set(asignacion.usuario.id, {
      id: asignacion.usuario.id,
      nombre: `${asignacion.usuario.nombre} ${asignacion.usuario.apellido}`,
      roles: [asignacion.rol],
    });
  }

  return [...porUsuario.values()];
}

/** Versiones vigentes y anteriores de los respaldos de un ítem. */
export async function obtenerDocumentosDeItem(usuario: UsuarioSesion, itemProyectoId: string) {
  const enAlcance = await obtenerItemEnAlcance(usuario, itemProyectoId);
  if (!enAlcance) return null;

  const documentos = await prisma.documento.findMany({
    where: { itemProyectoId, eliminadoAt: null },
    orderBy: [{ esVersionActual: "desc" }, { version: "desc" }],
    select: {
      id: true,
      nombre: true,
      nombreOriginal: true,
      mimeType: true,
      tamanoBytes: true,
      version: true,
      esVersionActual: true,
      descripcion: true,
      subidoAt: true,
      subidoPor: { select: { nombre: true, apellido: true } },
    },
  });

  return documentos;
}

function aNumero(valor: Prisma.Decimal | null): number | null {
  return valor === null ? null : Number(valor);
}
