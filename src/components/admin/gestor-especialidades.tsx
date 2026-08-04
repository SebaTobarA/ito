"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { alternarEspecialidad, guardarEspecialidad } from "@/server/acciones/catalogos";
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

export interface EspecialidadEditable {
  id: string;
  codigo: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

/**
 * Especialidades técnicas.
 *
 * Tienen su propia pantalla y no son una opción de catálogo más porque las van
 * a referenciar las RDI, los protocolos y las agregaciones del informe
 * ejecutivo: su sigla aparece impresa en los reportes.
 */
export function GestorEspecialidades({
  especialidades,
}: {
  especialidades: EspecialidadEditable[];
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  return (
    <Tarjeta>
      <CabeceraTarjeta className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TituloTarjeta>Especialidades</TituloTarjeta>
          <DescripcionTarjeta>
            Su sigla aparece en las RDI, los protocolos y los reportes al mandante.
          </DescripcionTarjeta>
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
        {agregando && <Formulario alCerrar={() => setAgregando(false)} />}

        {especialidades.map((especialidad) =>
          editando === especialidad.id ? (
            <Formulario
              key={especialidad.id}
              especialidad={especialidad}
              alCerrar={() => setEditando(null)}
            />
          ) : (
            <Fila
              key={especialidad.id}
              especialidad={especialidad}
              alEditar={() => {
                setEditando(especialidad.id);
                setAgregando(false);
              }}
            />
          ),
        )}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function Fila({
  especialidad,
  alEditar,
}: {
  especialidad: EspecialidadEditable;
  alEditar: () => void;
}) {
  const { ejecutar, pendiente } = useAccion(alternarEspecialidad.bind(null, especialidad.id));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-borde px-3 py-2",
        !especialidad.activa && "bg-fondo/60",
      )}
    >
      <Insignia tono="marca" className="font-mono">
        {especialidad.codigo}
      </Insignia>
      <span
        className={cn("min-w-0 flex-1 text-sm text-texto", !especialidad.activa && "line-through")}
      >
        {especialidad.nombre}
      </span>
      {!especialidad.activa && <Insignia tono="neutro">Inactiva</Insignia>}

      <Boton variante="fantasma" tamano="sm" onClick={alEditar}>
        Editar
      </Boton>
      <form action={ejecutar}>
        <Boton type="submit" variante="fantasma" tamano="sm" disabled={pendiente}>
          {especialidad.activa ? "Desactivar" : "Reactivar"}
        </Boton>
      </form>
    </div>
  );
}

function Formulario({
  especialidad,
  alCerrar,
}: {
  especialidad?: EspecialidadEditable;
  alCerrar: () => void;
}) {
  const { ejecutar, pendiente, errores } = useAccion(
    guardarEspecialidad.bind(null, especialidad?.id ?? null),
    { alTerminar: (estado) => estado.ok && alCerrar() },
  );

  return (
    <form action={ejecutar} className="rounded-lg border border-[var(--marca-secundario)] p-3">
      <input type="hidden" name="orden" value={especialidad?.orden ?? 99} />
      <input type="hidden" name="activa" value={String(especialidad?.activa ?? true)} />

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <Campo etiqueta="Sigla" error={errores.codigo}>
          <Input
            name="codigo"
            defaultValue={especialidad?.codigo}
            required
            maxLength={6}
            placeholder="EST"
            className="font-mono uppercase"
          />
        </Campo>

        <Campo etiqueta="Nombre" error={errores.nombre}>
          <Input name="nombre" defaultValue={especialidad?.nombre} required autoFocus />
        </Campo>

        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton
            type="button"
            variante="fantasma"
            tamano="icono"
            onClick={alCerrar}
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </Boton>
        </div>
      </div>
    </form>
  );
}
