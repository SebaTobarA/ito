"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input, Selector } from "@/components/ui/campos";
import { Boton } from "@/components/ui/boton";
import { ETIQUETAS_CUMPLE } from "@/dominio/etiquetas";
import { cn } from "@/lib/utils";

interface Opcion {
  id: string;
  nombre: string;
}

/**
 * Filtros del checklist.
 *
 * Viven en la URL y no en estado local: así el filtrado lo hace la consulta (que
 * ya pasa por el filtro de alcance) en vez del navegador, y una vista filtrada se
 * puede compartir por enlace tal cual.
 */
export function FiltrosChecklist({
  categorias,
  equipo,
}: {
  categorias: Opcion[];
  equipo: Opcion[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const [pendiente, iniciarTransicion] = useTransition();

  const [busqueda, setBusqueda] = useState(parametros.get("q") ?? "");
  const primeraRenderizacion = useRef(true);

  function navegar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === "") siguientes.delete(clave);
      else siguientes.set(clave, valor);
    }
    const consulta = siguientes.toString();
    iniciarTransicion(() => {
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false });
    });
  }

  // La búsqueda espera a que se deje de escribir: sin esto se dispararía una
  // consulta por cada tecla.
  useEffect(() => {
    if (primeraRenderizacion.current) {
      primeraRenderizacion.current = false;
      return;
    }
    const temporizador = setTimeout(() => navegar({ q: busqueda || null }), 350);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const hayFiltros =
    Boolean(busqueda) ||
    ["categoria", "cumple", "responsable", "pendientes"].some((clave) => parametros.get(clave));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pendiente && "opacity-70")}>
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" />
        <Input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar por descripción, código o registro…"
          className="pl-9"
          aria-label="Buscar en el checklist"
        />
      </div>

      <Selector
        value={parametros.get("categoria") ?? ""}
        onChange={(evento) => navegar({ categoria: evento.target.value || null })}
        className="w-auto min-w-40"
        aria-label="Filtrar por categoría"
      >
        <option value="">Todas las categorías</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nombre}
          </option>
        ))}
      </Selector>

      <Selector
        value={parametros.get("cumple") ?? ""}
        onChange={(evento) => navegar({ cumple: evento.target.value || null })}
        className="w-auto min-w-36"
        aria-label="Filtrar por cumplimiento"
      >
        <option value="">Todo cumplimiento</option>
        {Object.entries(ETIQUETAS_CUMPLE).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </Selector>

      <Selector
        value={parametros.get("responsable") ?? ""}
        onChange={(evento) => navegar({ responsable: evento.target.value || null })}
        className="w-auto min-w-40"
        aria-label="Filtrar por responsable"
      >
        <option value="">Todo responsable</option>
        {equipo.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.nombre}
          </option>
        ))}
      </Selector>

      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-borde bg-white px-3 text-sm text-texto">
        <input
          type="checkbox"
          checked={parametros.get("pendientes") === "1"}
          onChange={(evento) => navegar({ pendientes: evento.target.checked ? "1" : null })}
          className="h-4 w-4 rounded border-borde"
        />
        Solo pendientes
      </label>

      {hayFiltros && (
        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={() => {
            setBusqueda("");
            navegar({
              q: null,
              categoria: null,
              cumple: null,
              responsable: null,
              pendientes: null,
            });
          }}
        >
          <X className="h-4 w-4" />
          Limpiar
        </Boton>
      )}
    </div>
  );
}
