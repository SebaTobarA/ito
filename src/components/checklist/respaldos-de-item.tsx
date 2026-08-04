"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Camera, Download, Loader2, Trash2, Upload } from "lucide-react";

import {
  eliminarDocumento,
  listarDocumentos,
  subirDocumento,
  type DocumentoListado,
} from "@/server/acciones/documentos";
import { useAccion } from "@/lib/use-accion";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/tarjeta";
import { formatearTamano } from "@/dominio/archivos";
import { cn } from "@/lib/utils";

/**
 * Respaldos de un ítem: subida, historial de versiones y descarga.
 *
 * La descarga pasa siempre por `/api/archivos/[id]`, que verifica permisos: la
 * clave del archivo en el almacenamiento no llega nunca al navegador.
 */
export function RespaldosDeItem({
  itemId,
  puedeSubir,
}: {
  itemId: string;
  puedeSubir: boolean;
}) {
  const [documentos, setDocumentos] = useState<DocumentoListado[] | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, iniciarCarga] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const recargar = useCallback(() => {
    iniciarCarga(async () => setDocumentos(await listarDocumentos(itemId)));
  }, [itemId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const { ejecutar, pendiente } = useAccion(subirDocumento.bind(null, itemId), {
    alTerminar: (estado) => {
      if (estado.ok) {
        formulario.current?.reset();
        recargar();
      }
    },
  });

  /** Deja el archivo soltado en el input y envía: un solo camino de subida. */
  function soltar(evento: React.DragEvent) {
    evento.preventDefault();
    setArrastrando(false);
    if (!puedeSubir) return;
    const archivos = evento.dataTransfer.files;
    if (archivos.length === 0 || !entrada.current) return;
    entrada.current.files = archivos;
    formulario.current?.requestSubmit();
  }

  return (
    <div className="rounded-lg border border-borde bg-white">
      <div className="flex items-center justify-between border-b border-borde px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
          Respaldos digitales
        </p>
        {(cargando || pendiente) && <Loader2 className="h-3.5 w-3.5 animate-spin text-texto-suave" />}
      </div>

      {documentos === null ? (
        <p className="px-3 py-4 text-xs text-texto-suave">Cargando respaldos…</p>
      ) : documentos.length === 0 ? (
        <p className="px-3 py-4 text-xs text-texto-suave">Todavía no hay respaldos cargados.</p>
      ) : (
        <ul className="divide-y divide-borde">
          {documentos.map((documento) => (
            <li key={documento.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={`/api/archivos/${documento.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs font-medium text-[var(--marca-secundario)] hover:underline"
                  >
                    {documento.nombre}
                  </a>
                  {documento.esVersionActual ? (
                    <Insignia tono="exito">v{documento.version} · vigente</Insignia>
                  ) : (
                    <Insignia tono="neutro">v{documento.version}</Insignia>
                  )}
                </div>
                <p className="text-[11px] text-texto-suave">
                  {formatearTamano(documento.tamanoBytes)} · {documento.subidoPor} ·{" "}
                  {new Date(documento.subidoAt).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <a
                href={`/api/archivos/${documento.id}`}
                download
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-texto-suave hover:bg-fondo"
                aria-label={`Descargar ${documento.nombre}`}
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              {puedeSubir && documento.esVersionActual && (
                <BotonNuevaVersion
                  itemId={itemId}
                  documentoId={documento.id}
                  alTerminar={recargar}
                />
              )}

              {puedeSubir && <BotonEliminar documentoId={documento.id} alTerminar={recargar} />}
            </li>
          ))}
        </ul>
      )}

      {puedeSubir && (
        <form
          ref={formulario}
          action={ejecutar}
          onDragOver={(evento) => {
            evento.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            "m-3 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-borde px-3 py-4 text-xs text-texto-suave transition-colors",
            arrastrando && "border-[var(--marca-secundario)] bg-[var(--marca-secundario)]/5",
          )}
        >
          <input
            ref={entrada}
            type="file"
            name="archivo"
            className="hidden"
            onChange={() => formulario.current?.requestSubmit()}
          />
          {/* `capture` abre la cámara directamente en el celular: la foto del
              avance se adjunta sin salir de la aplicación. */}
          <input
            ref={camara}
            type="file"
            name="archivo"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={() => formulario.current?.requestSubmit()}
          />

          <span className="hidden sm:inline">Arrastra un archivo aquí o</span>
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            disabled={pendiente}
            onClick={() => entrada.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Subir respaldo
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            disabled={pendiente}
            onClick={() => camara.current?.click()}
            className="sm:hidden"
          >
            <Camera className="h-3.5 w-3.5" />
            Tomar foto
          </Boton>
        </form>
      )}
    </div>
  );
}

function BotonNuevaVersion({
  itemId,
  documentoId,
  alTerminar,
}: {
  itemId: string;
  documentoId: string;
  alTerminar: () => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const { ejecutar, pendiente } = useAccion(subirDocumento.bind(null, itemId), {
    alTerminar: (estado) => {
      if (estado.ok) alTerminar();
    },
  });

  return (
    <form ref={formulario} action={ejecutar} className="contents">
      <input type="hidden" name="reemplazaAId" value={documentoId} />
      <input
        ref={entrada}
        type="file"
        name="archivo"
        className="hidden"
        onChange={() => formulario.current?.requestSubmit()}
      />
      <Boton
        type="button"
        variante="fantasma"
        tamano="sm"
        disabled={pendiente}
        onClick={() => entrada.current?.click()}
        className="h-7 px-2 text-[11px]"
      >
        Nueva versión
      </Boton>
    </form>
  );
}

function BotonEliminar({
  documentoId,
  alTerminar,
}: {
  documentoId: string;
  alTerminar: () => void;
}) {
  const { ejecutar, pendiente } = useAccion(eliminarDocumento.bind(null, documentoId), {
    alTerminar: (estado) => {
      if (estado.ok) alTerminar();
    },
  });

  return (
    <form action={ejecutar}>
      <Boton
        type="submit"
        variante="fantasma"
        tamano="icono"
        disabled={pendiente}
        aria-label="Eliminar respaldo"
        className="h-7 w-7 text-texto-suave hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Boton>
    </form>
  );
}
