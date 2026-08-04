"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import {
  alternarOpcionCatalogo,
  guardarOpcionCatalogo,
} from "@/server/acciones/catalogos";
import { useAccion } from "@/lib/use-accion";
import { Boton } from "@/components/ui/boton";
import { Campo, Input } from "@/components/ui/campos";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  DescripcionTarjeta,
  Insignia,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";
import { cn } from "@/lib/utils";

interface Opcion {
  id: string;
  codigo: string;
  etiqueta: string;
  orden: number;
  activa: boolean;
}

export interface GrupoCatalogo {
  tipo: string;
  etiqueta: string;
  descripcion: string;
  opciones: Opcion[];
}

export function GestorCatalogos({ grupos }: { grupos: GrupoCatalogo[] }) {
  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <GrupoDeCatalogo key={grupo.tipo} grupo={grupo} />
      ))}
    </div>
  );
}

function GrupoDeCatalogo({ grupo }: { grupo: GrupoCatalogo }) {
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  return (
    <Tarjeta>
      <CabeceraTarjeta className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TituloTarjeta>{grupo.etiqueta}</TituloTarjeta>
          <DescripcionTarjeta>{grupo.descripcion}</DescripcionTarjeta>
        </div>
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={() => {
            setAgregando((valor) => !valor);
            setEditando(null);
          }}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Boton>
      </CabeceraTarjeta>

      <CuerpoTarjeta className="space-y-2">
        {agregando && (
          <FormularioOpcion
            tipo={grupo.tipo}
            alCerrar={() => setAgregando(false)}
          />
        )}

        {grupo.opciones.length === 0 && !agregando && (
          <p className="py-2 text-sm text-texto-suave">
            Este catálogo está vacío. Agrega la primera opción.
          </p>
        )}

        {grupo.opciones.map((opcion) =>
          editando === opcion.id ? (
            <FormularioOpcion
              key={opcion.id}
              tipo={grupo.tipo}
              opcion={opcion}
              alCerrar={() => setEditando(null)}
            />
          ) : (
            <FilaOpcion
              key={opcion.id}
              opcion={opcion}
              alEditar={() => {
                setEditando(opcion.id);
                setAgregando(false);
              }}
            />
          ),
        )}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function FilaOpcion({ opcion, alEditar }: { opcion: Opcion; alEditar: () => void }) {
  const { ejecutar, pendiente } = useAccion(alternarOpcionCatalogo.bind(null, opcion.id));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-borde px-3 py-2",
        !opcion.activa && "bg-fondo/60",
      )}
    >
      <span className="font-mono text-xs text-texto-suave">{opcion.codigo}</span>
      <span className={cn("min-w-0 flex-1 text-sm text-texto", !opcion.activa && "line-through")}>
        {opcion.etiqueta}
      </span>
      {!opcion.activa && <Insignia tono="neutro">Inactiva</Insignia>}

      <Boton variante="fantasma" tamano="sm" onClick={alEditar}>
        Editar
      </Boton>
      <form action={ejecutar}>
        <Boton type="submit" variante="fantasma" tamano="sm" disabled={pendiente}>
          {opcion.activa ? "Desactivar" : "Reactivar"}
        </Boton>
      </form>
    </div>
  );
}

/**
 * Alta y edición de una opción.
 *
 * El código no se puede cambiar una vez creada: la lógica de la aplicación lo
 * usa para decidir comportamiento (qué módulos activa un servicio), y
 * renombrarlo rompería proyectos existentes en silencio.
 */
function FormularioOpcion({
  tipo,
  opcion,
  alCerrar,
}: {
  tipo: string;
  opcion?: Opcion;
  alCerrar: () => void;
}) {
  const { ejecutar, pendiente, errores } = useAccion(
    guardarOpcionCatalogo.bind(null, opcion?.id ?? null),
    { alTerminar: (estado) => estado.ok && alCerrar() },
  );

  return (
    <form action={ejecutar} className="rounded-lg border border-[var(--marca-secundario)] p-3">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="orden" value={opcion?.orden ?? 99} />
      {opcion && <input type="hidden" name="codigo" value={opcion.codigo} />}

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Campo etiqueta="Código" error={errores.codigo}>
          <Input
            name={opcion ? "codigoVisible" : "codigo"}
            defaultValue={opcion?.codigo}
            disabled={Boolean(opcion)}
            required={!opcion}
            placeholder="EJ_CODIGO"
            className="font-mono text-xs uppercase"
          />
        </Campo>

        <Campo etiqueta="Nombre visible" error={errores.etiqueta}>
          <Input name="etiqueta" defaultValue={opcion?.etiqueta} required autoFocus />
        </Campo>

        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton type="button" variante="fantasma" tamano="icono" onClick={alCerrar} aria-label="Cancelar">
            <X className="h-4 w-4" />
          </Boton>
        </div>
      </div>

      {opcion ? (
        <p className="mt-2 text-xs text-texto-suave">
          El código no se puede cambiar: la aplicación lo usa para decidir qué módulos activa cada
          servicio, y renombrarlo rompería los proyectos que ya lo usan.
        </p>
      ) : (
        <input type="hidden" name="activa" value="true" />
      )}
      {opcion && <input type="hidden" name="activa" value={String(opcion.activa)} />}
    </form>
  );
}
