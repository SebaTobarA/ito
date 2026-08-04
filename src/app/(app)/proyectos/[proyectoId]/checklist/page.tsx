import { notFound } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { contextoProyecto } from "@/server/datos/alcance";
import {
  hayFiltrosActivos,
  obtenerChecklist,
  obtenerEquipoProyecto,
  type FiltrosChecklist as Filtros,
} from "@/server/datos/checklist";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { PildoraCumplimiento } from "@/components/ui/cumplimiento";
import { EstadoVacio, Tarjeta } from "@/components/ui/tarjeta";
import { CategoriaChecklist } from "@/components/checklist/categoria-checklist";
import { FiltrosChecklist } from "@/components/checklist/filtros-checklist";
import { NuevoItem } from "@/components/checklist/nuevo-item";

export const metadata = { title: "Checklist de calidad" };

interface ParametrosBusqueda {
  q?: string;
  categoria?: string;
  cumple?: string;
  responsable?: string;
  pendientes?: string;
}

export default async function PaginaChecklist({
  params,
  searchParams,
}: {
  params: Promise<{ proyectoId: string }>;
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const { proyectoId } = await params;
  const consulta = await searchParams;
  const usuario = (await usuarioActual())!;

  const filtros: Filtros = {
    busqueda: consulta.q,
    categoriaId: consulta.categoria,
    cumple: consulta.cumple as Filtros["cumple"],
    responsableUsuarioId: consulta.responsable,
    soloPendientes: consulta.pendientes === "1",
  };

  const [checklist, equipo, empresa] = await Promise.all([
    obtenerChecklist(usuario, proyectoId, filtros),
    obtenerEquipoProyecto(usuario, proyectoId),
    obtenerConfiguracionSegura(),
  ]);
  if (!checklist) notFound();

  const contexto = await contextoProyecto(usuario, proyectoId);
  const puedeEditar = puede(usuario, "item.editar", contexto ?? {});
  const puedeCrear = puede(usuario, "item.crear", contexto ?? {});
  const puedeSubir = puede(usuario, "documento.subir", contexto ?? {});

  const { proyecto, categorias } = checklist;
  const filtrando = hayFiltrosActivos(filtros);
  const itemsVisibles = categorias.reduce((suma, categoria) => suma + categoria.items.length, 0);

  return (
    <>
      {/* El encabezado del proyecto y las pestañas los pone el layout. */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-texto-suave">
            {proyecto.itemsCumplen} de {proyecto.itemsAplicables} ítems aplicables cumplen
          </p>
          <PildoraCumplimiento
            porcentaje={proyecto.porcentajeCumplimiento}
            umbralBajo={empresa.umbralCumplimientoBajo}
            className="text-base"
          />
        </div>

        <FiltrosChecklist
          categorias={categorias.map((categoria) => ({
            id: categoria.id,
            nombre: `${categoria.codigo} — ${categoria.nombre}`,
          }))}
          equipo={equipo}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {filtrando && (
            <p className="text-sm text-texto-suave">
              {itemsVisibles === 0
                ? "Ningún registro coincide con el filtro."
                : `${itemsVisibles} registro${itemsVisibles === 1 ? "" : "s"} coinciden con el filtro.`}
            </p>
          )}
          {puedeCrear && (
            <div className="ml-auto">
              <NuevoItem
                categorias={categorias.map((categoria) => ({
                  id: categoria.id,
                  codigo: categoria.codigo,
                  nombre: categoria.nombre,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {categorias.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            titulo="Este proyecto todavía no tiene checklist"
            descripcion="El checklist se genera al crear el proyecto a partir de la plantilla maestra activa."
          />
        </Tarjeta>
      ) : (
        <div className="space-y-3">
          {categorias.map((categoria, indice) => (
            <CategoriaChecklist
              key={categoria.id}
              categoria={categoria}
              equipo={equipo}
              umbralBajo={empresa.umbralCumplimientoBajo}
              puedeEditar={puedeEditar}
              puedeSubir={puedeSubir}
              // Con un filtro activo se abre todo: lo que se busca tiene que verse
              // sin tener que desplegar veinte categorías a mano.
              abiertaPorDefecto={filtrando || indice === 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
