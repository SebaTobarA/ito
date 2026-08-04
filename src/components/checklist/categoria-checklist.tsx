"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { accionMasivaCategoria } from "@/server/acciones/items";
import { useAccion } from "@/lib/use-accion";
import { Boton } from "@/components/ui/boton";
import { Selector } from "@/components/ui/campos";
import { BarraCumplimiento } from "@/components/ui/cumplimiento";
import { Insignia, Tarjeta } from "@/components/ui/tarjeta";
import { cn } from "@/lib/utils";
import type { CategoriaChecklist as DatosCategoria } from "@/server/datos/checklist";
import { ItemChecklist } from "./item-checklist";

export function CategoriaChecklist({
  categoria,
  equipo,
  umbralBajo,
  puedeEditar,
  puedeSubir,
  abiertaPorDefecto,
}: {
  categoria: DatosCategoria;
  equipo: { id: string; nombre: string }[];
  umbralBajo: number;
  puedeEditar: boolean;
  puedeSubir: boolean;
  abiertaPorDefecto: boolean;
}) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto);
  const { ejecutar, pendiente } = useAccion(accionMasivaCategoria);

  const filtrada = categoria.items.length !== categoria.totalItems;
  const subgrupos = agruparPorSubgrupo(categoria.items);

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
        <button
          type="button"
          onClick={() => setAbierta((valor) => !valor)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={abierta}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-texto-suave transition-transform",
              abierta && "rotate-180",
            )}
          />
          <span className="font-mono text-xs text-texto-suave">{categoria.codigo}</span>
          <span className="min-w-0 truncate text-sm font-medium text-texto">
            {categoria.nombre}
          </span>
          <span className="shrink-0 text-xs text-texto-suave">
            {filtrada
              ? `${categoria.items.length} de ${categoria.totalItems}`
              : `${categoria.totalItems} registros`}
          </span>
          {!categoria.aplica && <Insignia tono="neutro">No aplica</Insignia>}
        </button>

        <div className="w-full sm:w-56">
          <BarraCumplimiento
            porcentaje={categoria.porcentajeCumplimiento}
            umbralBajo={umbralBajo}
          />
        </div>
      </div>

      {abierta && (
        <>
          {puedeEditar && (
            <div className="flex flex-wrap items-center gap-2 border-t border-borde bg-fondo px-4 py-2.5">
              <span className="text-xs font-medium text-texto-suave">Toda la categoría:</span>

              <form action={ejecutar} className="inline-flex items-center gap-2">
                <input type="hidden" name="categoriaProyectoId" value={categoria.id} />
                <input
                  type="hidden"
                  name="operacion"
                  value={categoria.aplica ? "marcarNoAplica" : "marcarAplica"}
                />
                <Boton type="submit" variante="secundario" tamano="sm" disabled={pendiente}>
                  {categoria.aplica ? "Marcar como no aplica" : "Reactivar categoría"}
                </Boton>
              </form>

              <form action={ejecutar} className="inline-flex items-center gap-2">
                <input type="hidden" name="categoriaProyectoId" value={categoria.id} />
                <input type="hidden" name="operacion" value="asignarResponsable" />
                <Selector
                  name="responsableUsuarioId"
                  defaultValue=""
                  disabled={pendiente}
                  aria-label={`Asignar responsable a toda la categoría ${categoria.nombre}`}
                  className="h-8 w-auto min-w-40 text-xs"
                  onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
                >
                  <option value="">Asignar responsable a todos…</option>
                  {equipo.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombre}
                    </option>
                  ))}
                </Selector>
              </form>
            </div>
          )}

          <div className="border-t border-borde">
            {categoria.items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-texto-suave">
                Ningún registro de esta categoría coincide con el filtro.
              </p>
            )}

            {subgrupos.map(({ nombre, items }) => (
              <div key={nombre ?? "__sin_subgrupo__"}>
                {nombre && (
                  <p className="border-b border-borde bg-fondo/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-texto-suave">
                    {nombre}
                  </p>
                )}
                {items.map((item) => (
                  <ItemChecklist
                    key={item.id}
                    item={item}
                    equipo={equipo}
                    puedeEditar={puedeEditar}
                    puedeSubir={puedeSubir}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </Tarjeta>
  );
}

/**
 * Agrupa los ítems por subgrupo conservando el orden en que vienen.
 *
 * Los subgrupos existen porque una categoría como «Protocolos de control de
 * calidad» tiene 38 registros: sin agrupar, en un celular es inmanejable.
 */
function agruparPorSubgrupo(items: DatosCategoria["items"]) {
  const grupos: { nombre: string | null; items: DatosCategoria["items"] }[] = [];

  for (const item of items) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nombre === item.subgrupo) {
      ultimo.items.push(item);
      continue;
    }
    grupos.push({ nombre: item.subgrupo, items: [item] });
  }

  return grupos;
}
