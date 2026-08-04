import type { TipoCatalogo } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Consultas de los catálogos configurables.
 *
 * No llevan filtro de alcance porque no son datos de proyecto: son parámetros
 * de la empresa, visibles para todo usuario autenticado. Editarlos sí exige el
 * permiso `catalogo.gestionar`, que se verifica en las acciones.
 */

export const ETIQUETAS_TIPO_CATALOGO: Record<TipoCatalogo, string> = {
  TIPO_PROYECTO: "Tipos de proyecto",
  ESTADO_DOCUMENTO: "Estados de documento",
  CAUSA_NO_CUMPLIMIENTO: "Causas de no cumplimiento",
  TIPO_SERVICIO: "Servicios contratables",
  CARGO_EQUIPO: "Cargos del equipo",
  RECURSO_TERRENO: "Recursos de terreno",
};

export const DESCRIPCIONES_TIPO_CATALOGO: Record<TipoCatalogo, string> = {
  TIPO_PROYECTO: "Clasificación de la obra en la ficha del proyecto.",
  ESTADO_DOCUMENTO: "Estados que puede tener un documento en seguimiento.",
  CAUSA_NO_CUMPLIMIENTO: "Motivos de atraso que se reportan en el informe semanal.",
  TIPO_SERVICIO: "Lo que se le puede contratar. Define qué módulos se activan en cada proyecto.",
  CARGO_EQUIPO: "Cargos con que se asigna al equipo en la guía de planificación.",
  RECURSO_TERRENO: "Equipamiento que la ITO necesita disponible en obra.",
};

export const TIPOS_DE_CATALOGO = Object.keys(ETIQUETAS_TIPO_CATALOGO) as TipoCatalogo[];

export async function obtenerEspecialidades(soloActivas = false) {
  return prisma.especialidad.findMany({
    where: soloActivas ? { activa: true } : {},
    orderBy: [{ orden: "asc" }, { codigo: "asc" }],
  });
}

export async function obtenerOpciones(tipo: TipoCatalogo, soloActivas = false) {
  return prisma.opcionCatalogo.findMany({
    where: { tipo, ...(soloActivas ? { activa: true } : {}) },
    orderBy: [{ orden: "asc" }, { etiqueta: "asc" }],
  });
}

/** Todos los catálogos agrupados por tipo, para la pantalla de administración. */
export async function obtenerCatalogosAgrupados() {
  const opciones = await prisma.opcionCatalogo.findMany({
    orderBy: [{ tipo: "asc" }, { orden: "asc" }, { etiqueta: "asc" }],
  });

  return TIPOS_DE_CATALOGO.map((tipo) => ({
    tipo,
    etiqueta: ETIQUETAS_TIPO_CATALOGO[tipo],
    descripcion: DESCRIPCIONES_TIPO_CATALOGO[tipo],
    opciones: opciones.filter((opcion) => opcion.tipo === tipo),
  }));
}
