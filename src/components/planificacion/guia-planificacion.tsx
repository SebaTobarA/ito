"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  actualizarDedicacion,
  actualizarEnfoqueServicio,
  actualizarResponsabilidad,
  actualizarServicioContratado,
} from "@/server/acciones/planificacion";
import { useAccion } from "@/lib/use-accion";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Input, Selector } from "@/components/ui/campos";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  DescripcionTarjeta,
  Insignia,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";
import { ETIQUETAS_ROL_PROYECTO } from "@/dominio/etiquetas";
import { cn } from "@/lib/utils";
import type { Planificacion } from "@/server/datos/planificacion";

const ETIQUETAS_DEDICACION = {
  TOTAL: "Dedicación total",
  PARCIAL: "Dedicación parcial",
  VISITAS: "Por visitas",
} as const;

export function GuiaPlanificacion({
  planificacion,
  equipoAsignable,
  itemsDelChecklist,
  puedeEditar,
}: {
  planificacion: Planificacion;
  equipoAsignable: { id: string; nombre: string }[];
  itemsDelChecklist: { id: string; etiqueta: string; categoria: string }[];
  puedeEditar: boolean;
}) {
  const { proyecto, servicios, equipo, responsabilidades, resumen } = planificacion;

  return (
    <div className="space-y-4">
      <Resumen resumen={resumen} />

      <Servicios servicios={servicios} puedeEditar={puedeEditar} />

      <Enfoque
        proyectoId={proyecto.id}
        enfoque={proyecto.enfoqueServicio}
        puedeEditar={puedeEditar}
      />

      <Equipo equipo={equipo} puedeEditar={puedeEditar} />

      <Matriz
        responsabilidades={responsabilidades}
        equipoAsignable={equipoAsignable}
        itemsDelChecklist={itemsDelChecklist}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}

function Resumen({ resumen }: { resumen: Planificacion["resumen"] }) {
  return (
    <Tarjeta className={cn(resumen.completa ? "border-green-300" : "border-amber-300")}>
      <CuerpoTarjeta className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {resumen.completa ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
            <Check className="h-4 w-4" />
            Guía de planificación completa
          </span>
        ) : (
          <span className="font-medium text-amber-700">Guía de planificación incompleta</span>
        )}
        <span className="text-texto-suave">
          {resumen.serviciosContratados} servicio
          {resumen.serviciosContratados === 1 ? "" : "s"} contratado
          {resumen.serviciosContratados === 1 ? "" : "s"}
        </span>
        <span className="text-texto-suave">
          {resumen.responsabilidadesAplicables} responsabilidades aplicables
        </span>
        {resumen.responsabilidadesSinAsignar > 0 && (
          <span className="text-amber-700">
            {resumen.responsabilidadesSinAsignar} sin responsable
          </span>
        )}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

/**
 * Servicios contratados.
 *
 * No es documentación: marcar un servicio activa módulos para todo el equipo,
 * por eso el aviso explícito bajo el título.
 */
function Servicios({
  servicios,
  puedeEditar,
}: {
  servicios: Planificacion["servicios"];
  puedeEditar: boolean;
}) {
  return (
    <Tarjeta>
      <CabeceraTarjeta>
        <TituloTarjeta>Alcance del servicio contratado</TituloTarjeta>
        <DescripcionTarjeta>
          Lo que se marque aquí decide qué módulos ve el equipo en este proyecto.
        </DescripcionTarjeta>
      </CabeceraTarjeta>
      <CuerpoTarjeta className="space-y-2">
        {servicios.map((servicio) => (
          <FilaServicio key={servicio.id} servicio={servicio} puedeEditar={puedeEditar} />
        ))}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function FilaServicio({
  servicio,
  puedeEditar,
}: {
  servicio: Planificacion["servicios"][number];
  puedeEditar: boolean;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const { ejecutar, pendiente } = useAccion(actualizarServicioContratado.bind(null, servicio.id));
  const guardar = () => formulario.current?.requestSubmit();

  return (
    <form
      ref={formulario}
      action={ejecutar}
      className={cn(
        "rounded-lg border border-borde p-3 transition-colors",
        servicio.aplica && "border-[var(--marca-secundario)] bg-[var(--marca-secundario)]/5",
        pendiente && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          {/* Acompaña al checkbox para que el campo viaje incluso desmarcado. */}
          <input type="hidden" name="aplica" value="false" />
          <input
            key={`aplica-${servicio.aplica}`}
            type="checkbox"
            name="aplica"
            defaultChecked={servicio.aplica}
            onChange={guardar}
            disabled={!puedeEditar}
            className="h-4 w-4 shrink-0 rounded border-borde"
          />
          <span className="text-sm font-medium text-texto">{servicio.etiqueta}</span>
        </label>

        {servicio.aplica && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              key={`inicio-${servicio.fechaInicio?.toISOString() ?? ""}`}
              type="date"
              name="fechaInicio"
              defaultValue={aValorFecha(servicio.fechaInicio)}
              onChange={guardar}
              disabled={!puedeEditar}
              aria-label="Fecha de inicio del servicio"
              className="h-9 w-auto text-xs"
            />
            <Input
              key={`termino-${servicio.fechaTermino?.toISOString() ?? ""}`}
              type="date"
              name="fechaTermino"
              defaultValue={aValorFecha(servicio.fechaTermino)}
              onChange={guardar}
              disabled={!puedeEditar}
              aria-label="Fecha de término del servicio"
              className="h-9 w-auto text-xs"
            />
          </div>
        )}
      </div>

      {servicio.aplica && (
        <Input
          name="comentario"
          defaultValue={servicio.comentario ?? ""}
          onBlur={guardar}
          disabled={!puedeEditar}
          placeholder="Comentario sobre el alcance de este servicio…"
          className="mt-2 h-9 text-xs"
        />
      )}
    </form>
  );
}

function Enfoque({
  proyectoId,
  enfoque,
  puedeEditar,
}: {
  proyectoId: string;
  enfoque: string | null;
  puedeEditar: boolean;
}) {
  const { ejecutar, pendiente } = useAccion(actualizarEnfoqueServicio.bind(null, proyectoId));

  return (
    <Tarjeta>
      <CabeceraTarjeta>
        <TituloTarjeta>Enfoque del servicio</TituloTarjeta>
        <DescripcionTarjeta>
          El criterio de gestión con que se va a llevar esta obra en particular.
        </DescripcionTarjeta>
      </CabeceraTarjeta>
      <CuerpoTarjeta>
        <form action={ejecutar} className="space-y-2">
          <AreaTexto
            name="enfoqueServicio"
            defaultValue={enfoque ?? ""}
            disabled={!puedeEditar}
            placeholder="Qué se va a priorizar, con qué frecuencia, qué acordó el mandante…"
            className="min-h-24"
          />
          {puedeEditar && (
            <Boton type="submit" variante="secundario" tamano="sm" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar enfoque"}
            </Boton>
          )}
        </form>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function Equipo({
  equipo,
  puedeEditar,
}: {
  equipo: Planificacion["equipo"];
  puedeEditar: boolean;
}) {
  return (
    <Tarjeta>
      <CabeceraTarjeta>
        <TituloTarjeta>Equipo asignado</TituloTarjeta>
        <DescripcionTarjeta>
          Las iniciales se derivan del nombre; la asignación se cambia en la ficha del proyecto.
        </DescripcionTarjeta>
      </CabeceraTarjeta>
      <CuerpoTarjeta className="space-y-2">
        {equipo.length === 0 && (
          <p className="text-sm text-texto-suave">
            Todavía no hay equipo asignado. Se asigna al editar la ficha del proyecto.
          </p>
        )}
        {equipo.map((persona) => (
          <FilaEquipo key={persona.id} persona={persona} puedeEditar={puedeEditar} />
        ))}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function FilaEquipo({
  persona,
  puedeEditar,
}: {
  persona: Planificacion["equipo"][number];
  puedeEditar: boolean;
}) {
  const { ejecutar, pendiente } = useAccion(actualizarDedicacion);

  return (
    <form
      action={ejecutar}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-borde px-3 py-2",
        pendiente && "opacity-70",
      )}
    >
      <input type="hidden" name="asignacionId" value={persona.id} />
      <Insignia tono="marca" className="font-mono">
        {persona.iniciales}
      </Insignia>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-texto">{persona.nombre}</p>
        <p className="text-xs text-texto-suave">
          {ETIQUETAS_ROL_PROYECTO[persona.rol as keyof typeof ETIQUETAS_ROL_PROYECTO]}
          {persona.cargo ? ` · ${persona.cargo}` : ""}
        </p>
      </div>
      <Selector
        key={`dedicacion-${persona.dedicacion ?? ""}`}
        name="dedicacion"
        defaultValue={persona.dedicacion ?? ""}
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
        disabled={!puedeEditar}
        aria-label={`Dedicación de ${persona.nombre}`}
        className="h-9 w-auto min-w-40 text-xs"
      >
        <option value="">Sin definir</option>
        {Object.entries(ETIQUETAS_DEDICACION).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </Selector>
    </form>
  );
}

function Matriz({
  responsabilidades,
  equipoAsignable,
  itemsDelChecklist,
  puedeEditar,
}: {
  responsabilidades: Planificacion["responsabilidades"];
  equipoAsignable: { id: string; nombre: string }[];
  itemsDelChecklist: { id: string; etiqueta: string; categoria: string }[];
  puedeEditar: boolean;
}) {
  const [soloSinAsignar, setSoloSinAsignar] = useState(false);

  const visibles = soloSinAsignar
    ? responsabilidades.filter((r) => r.aplica && !r.responsableUsuarioId)
    : responsabilidades;

  return (
    <Tarjeta>
      <CabeceraTarjeta className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TituloTarjeta>Matriz de responsabilidades</TituloTarjeta>
          <DescripcionTarjeta>
            Quién responde por cada obligación del servicio y con qué registro se evidencia.
          </DescripcionTarjeta>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-texto">
          <input
            type="checkbox"
            checked={soloSinAsignar}
            onChange={(evento) => setSoloSinAsignar(evento.target.checked)}
            className="h-4 w-4 rounded border-borde"
          />
          Solo sin responsable
        </label>
      </CabeceraTarjeta>

      <CuerpoTarjeta className="space-y-1.5">
        {visibles.length === 0 && (
          <p className="py-4 text-center text-sm text-texto-suave">
            {soloSinAsignar
              ? "Todas las responsabilidades aplicables tienen responsable."
              : "Este proyecto no tiene matriz de responsabilidades."}
          </p>
        )}
        {visibles.map((responsabilidad) => (
          <FilaResponsabilidad
            key={responsabilidad.id}
            responsabilidad={responsabilidad}
            equipoAsignable={equipoAsignable}
            itemsDelChecklist={itemsDelChecklist}
            puedeEditar={puedeEditar}
          />
        ))}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

function FilaResponsabilidad({
  responsabilidad,
  equipoAsignable,
  itemsDelChecklist,
  puedeEditar,
}: {
  responsabilidad: Planificacion["responsabilidades"][number];
  equipoAsignable: { id: string; nombre: string }[];
  itemsDelChecklist: { id: string; etiqueta: string; categoria: string }[];
  puedeEditar: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const { ejecutar, pendiente } = useAccion(
    actualizarResponsabilidad.bind(null, responsabilidad.id),
  );
  const guardar = () => formulario.current?.requestSubmit();

  return (
    <form
      ref={formulario}
      action={ejecutar}
      className={cn(
        "rounded-lg border border-borde p-3",
        !responsabilidad.aplica && "bg-fondo/60",
        pendiente && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="aplica" value="false" />
        <input
          key={`aplica-${responsabilidad.aplica}`}
          type="checkbox"
          name="aplica"
          defaultChecked={responsabilidad.aplica}
          onChange={guardar}
          disabled={!puedeEditar}
          aria-label={`¿Aplica ${responsabilidad.codigo}?`}
          className="h-4 w-4 shrink-0 rounded border-borde"
        />
        <span className="font-mono text-xs text-texto-suave">{responsabilidad.codigo}</span>
        <span
          className={cn(
            "min-w-0 flex-1 text-sm text-texto",
            !responsabilidad.aplica && "text-texto-suave line-through",
          )}
        >
          {responsabilidad.descripcion}
        </span>

        {responsabilidad.responsableIniciales ? (
          <Insignia tono="marca" className="font-mono">
            {responsabilidad.responsableIniciales}
          </Insignia>
        ) : (
          responsabilidad.aplica && <Insignia tono="aviso">Sin responsable</Insignia>
        )}

        <Selector
          key={`responsable-${responsabilidad.responsableUsuarioId ?? ""}`}
          name="responsableUsuarioId"
          defaultValue={responsabilidad.responsableUsuarioId ?? ""}
          onChange={guardar}
          disabled={!puedeEditar || !responsabilidad.aplica}
          aria-label={`Responsable de ${responsabilidad.codigo}`}
          className="h-9 w-auto min-w-36 text-xs"
        >
          <option value="">Sin asignar</option>
          {equipoAsignable.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombre}
            </option>
          ))}
        </Selector>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          className="inline-flex items-center gap-1 text-xs text-texto-suave hover:text-texto"
          aria-expanded={abierto}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", abierto && "rotate-180")} />
          Detalle
        </button>

        {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin text-texto-suave" />}
      </div>

      {abierto && (
        <div className="mt-3 grid gap-3 rounded-lg bg-fondo p-3 lg:grid-cols-3">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-texto-suave">
              Registro que la evidencia
            </p>
            <Selector
              key={`item-${responsabilidad.itemProyectoId ?? ""}`}
              name="itemProyectoId"
              defaultValue={responsabilidad.itemProyectoId ?? ""}
              onChange={guardar}
              disabled={!puedeEditar}
              className="h-9 text-xs"
            >
              <option value="">Sin registro asociado</option>
              {itemsDelChecklist.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.etiqueta}
                </option>
              ))}
            </Selector>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-texto-suave">
              Requerimiento del cliente
            </p>
            <Input
              name="requerimientoCliente"
              defaultValue={responsabilidad.requerimientoCliente ?? ""}
              onBlur={guardar}
              disabled={!puedeEditar}
              placeholder="Lo que pide en vez del estándar"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-texto-suave">
              Observaciones
            </p>
            <Input
              name="observaciones"
              defaultValue={responsabilidad.observaciones ?? ""}
              onBlur={guardar}
              disabled={!puedeEditar}
              className="h-9 text-xs"
            />
          </div>
        </div>
      )}
    </form>
  );
}

function aValorFecha(fecha: Date | string | null): string {
  if (!fecha) return "";
  return new Date(fecha).toISOString().slice(0, 10);
}
