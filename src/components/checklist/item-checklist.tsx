"use client";

import { useRef, useState } from "react";
import { ChevronDown, Loader2, Paperclip } from "lucide-react";

import { actualizarItem } from "@/server/acciones/items";
import { useAccion } from "@/lib/use-accion";
import { AreaTexto, Input, Selector } from "@/components/ui/campos";
import { Insignia } from "@/components/ui/tarjeta";
import { ETIQUETAS_CUMPLE, ETIQUETAS_REQUISITO, ETIQUETAS_SI_NO_NA } from "@/dominio/etiquetas";
import {
  ABREVIATURAS_FRECUENCIA,
  ETIQUETAS_FRECUENCIA,
  estadoControl,
  type Frecuencia,
} from "@/dominio/frecuencias";
import { cn } from "@/lib/utils";
import type { ItemChecklist as DatosItem } from "@/server/datos/checklist";
import { RespaldosDeItem } from "./respaldos-de-item";

const TONO_CUMPLE = {
  SI: "exito",
  NO: "peligro",
  NA: "neutro",
  PENDIENTE: "aviso",
} as const;

export function ItemChecklist({
  item,
  equipo,
  puedeEditar,
  puedeSubir,
}: {
  item: DatosItem;
  equipo: { id: string; nombre: string }[];
  puedeEditar: boolean;
  puedeSubir: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const { ejecutar, pendiente } = useAccion(actualizarItem.bind(null, item.id));

  /** Guarda apenas cambia un control: no hay botón «guardar» en la fila. */
  const guardar = () => formulario.current?.requestSubmit();

  const control = estadoControl(item.fechaProximoControl);
  const atenuado = !item.aplica;

  return (
    <div
      className={cn(
        "border-b border-borde last:border-b-0",
        atenuado && "bg-fondo/60",
        pendiente && "opacity-70",
      )}
    >
      <form ref={formulario} action={ejecutar} className="px-4 py-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-4">
          {/* Identificación y descripción */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-texto-suave">{item.codigo}</span>
              {item.codigoRegistro && (
                <Insignia tono="marca" className="font-mono">
                  {item.codigoRegistro}
                </Insignia>
              )}
              <Insignia tono="neutro" title={ETIQUETAS_FRECUENCIA[item.frecuencia as Frecuencia]}>
                {ABREVIATURAS_FRECUENCIA[item.frecuencia as Frecuencia]}
              </Insignia>
              {item.esAdHoc && <Insignia tono="marca">A medida</Insignia>}
              {item.controlaVencimiento && <Insignia tono="aviso">Controla vencimiento</Insignia>}
              {control === "atrasado" && item.aplica && <Insignia tono="peligro">Atrasado</Insignia>}
              {control === "proximo" && item.aplica && <Insignia tono="aviso">Por vencer</Insignia>}
            </div>

            <p className={cn("mt-1 text-sm text-texto", atenuado && "text-texto-suave line-through")}>
              {item.descripcion}
            </p>

            <button
              type="button"
              onClick={() => setAbierto((valor) => !valor)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-texto-suave hover:text-texto"
              aria-expanded={abierto}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", abierto && "rotate-180")} />
              {abierto ? "Menos detalle" : "Más detalle"}
              {item.totalDocumentos > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {item.totalDocumentos}
                </span>
              )}
              {item.observaciones && <span className="ml-1.5">· con observaciones</span>}
            </button>
          </div>

          {/* Controles rápidos */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-borde bg-white px-2.5 text-xs text-texto">
              {/*
                La `key` va atada al valor del servidor a propósito. Estos campos
                son no controlados (el DOM manda mientras se edita), pero el
                servidor puede cambiarlos por su cuenta: subir un respaldo marca
                el respaldo digital como Sí. Sin la key, el control seguiría
                mostrando el valor viejo hasta recargar la página.
              */}
              <input
                key={`aplica-${item.aplica}`}
                type="checkbox"
                name="aplica"
                defaultChecked={item.aplica}
                onChange={guardar}
                disabled={!puedeEditar}
                className="h-3.5 w-3.5 rounded border-borde"
              />
              Aplica
            </label>

            <Selector
              key={`cumple-${item.cumple}`}
              name="cumple"
              defaultValue={item.cumple}
              onChange={guardar}
              disabled={!puedeEditar || !item.aplica}
              aria-label={`Cumplimiento de ${item.codigo}`}
              className="h-9 w-auto min-w-28 text-xs"
            >
              {Object.entries(ETIQUETAS_CUMPLE).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Selector>

            <CampoRespaldo
              nombre="respaldoDigital"
              titulo="Digital"
              requisito={item.requiereRespaldoDigital}
              valor={item.respaldoDigital}
              alCambiar={guardar}
              deshabilitado={!puedeEditar || !item.aplica}
            />
            <CampoRespaldo
              nombre="respaldoFisico"
              titulo="Físico"
              requisito={item.requiereRespaldoFisico}
              valor={item.respaldoFisico}
              alCambiar={guardar}
              deshabilitado={!puedeEditar || !item.aplica}
            />

            <Selector
              key={`responsable-${item.responsableUsuarioId ?? ""}`}
              name="responsableUsuarioId"
              defaultValue={item.responsableUsuarioId ?? ""}
              onChange={guardar}
              disabled={!puedeEditar}
              aria-label={`Responsable de ${item.codigo}`}
              className="h-9 w-auto min-w-36 text-xs"
            >
              <option value="">Sin asignar</option>
              {equipo.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.nombre}
                </option>
              ))}
            </Selector>

            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin text-texto-suave" aria-label="Guardando" />
            ) : (
              <Insignia tono={TONO_CUMPLE[item.cumple as keyof typeof TONO_CUMPLE]}>
                {ETIQUETAS_CUMPLE[item.cumple as keyof typeof ETIQUETAS_CUMPLE]}
              </Insignia>
            )}
          </div>
        </div>

        {abierto && (
          <div className="mt-3 grid gap-3 rounded-lg bg-fondo p-3 sm:grid-cols-2 lg:grid-cols-4">
            {item.instrucciones && (
              <p className="text-xs text-texto-suave sm:col-span-2 lg:col-span-4">
                {item.instrucciones}
              </p>
            )}

            <Detalle titulo="Frecuencia">
              <Selector
                name="frecuencia"
                defaultValue={item.frecuencia}
                onChange={guardar}
                disabled={!puedeEditar}
                className="h-9 text-xs"
              >
                {Object.entries(ETIQUETAS_FRECUENCIA).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </Selector>
            </Detalle>

            <Detalle titulo="Último control">
              <Input
                key={`ultimo-${aValorFecha(item.fechaUltimoControl)}`}
                type="date"
                name="fechaUltimoControl"
                defaultValue={aValorFecha(item.fechaUltimoControl)}
                onChange={guardar}
                disabled={!puedeEditar}
                className="h-9 text-xs"
              />
            </Detalle>

            <Detalle titulo="Próximo control">
              <p className="flex h-9 items-center text-xs text-texto">
                {item.fechaProximoControl
                  ? new Date(item.fechaProximoControl).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })
                  : "Sin plazo automático"}
              </p>
            </Detalle>

            <Detalle titulo="Revisa">
              <p className="flex h-9 items-center text-xs text-texto">{item.revisorRol}</p>
            </Detalle>

            <Detalle titulo="Observaciones" className="sm:col-span-2 lg:col-span-4">
              <AreaTexto
                name="observaciones"
                defaultValue={item.observaciones ?? ""}
                onBlur={guardar}
                disabled={!puedeEditar}
                placeholder="Hallazgos, acuerdos, pendientes de este registro…"
                className="min-h-16 text-xs"
              />
            </Detalle>
          </div>
        )}
      </form>

      {abierto && (
        <div className="px-4 pb-4">
          <RespaldosDeItem itemId={item.id} puedeSubir={puedeSubir} />
        </div>
      )}
    </div>
  );
}

/**
 * Respaldo digital o físico.
 *
 * Un respaldo marcado como NO_APLICA en la plantilla no se puede editar: el
 * registro no lo contempla, y dejarlo editable invitaría a datos sin sentido.
 */
function CampoRespaldo({
  nombre,
  titulo,
  requisito,
  valor,
  alCambiar,
  deshabilitado,
}: {
  nombre: string;
  titulo: string;
  requisito: string;
  valor: string;
  alCambiar: () => void;
  deshabilitado: boolean;
}) {
  const noAplica = requisito === "NO_APLICA";
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-texto-suave" title={ETIQUETAS_REQUISITO[requisito as keyof typeof ETIQUETAS_REQUISITO]}>
        {titulo}
        {requisito === "REQUERIDO" && <span className="text-red-600">*</span>}
      </span>
      <Selector
        key={`${nombre}-${valor}`}
        name={nombre}
        defaultValue={valor}
        onChange={alCambiar}
        disabled={deshabilitado || noAplica}
        aria-label={`Respaldo ${titulo}`}
        className="h-9 w-auto min-w-16 text-xs"
      >
        {Object.entries(ETIQUETAS_SI_NO_NA).map(([opcion, etiqueta]) => (
          <option key={opcion} value={opcion}>
            {etiqueta}
          </option>
        ))}
      </Selector>
    </div>
  );
}

function Detalle({
  titulo,
  className,
  children,
}: {
  titulo: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-texto-suave">
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** `<input type="date">` espera AAAA-MM-DD y las fechas se guardan en UTC. */
function aValorFecha(fecha: Date | string | null): string {
  if (!fecha) return "";
  return new Date(fecha).toISOString().slice(0, 10);
}
