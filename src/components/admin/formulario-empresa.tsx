"use client";

import { useState } from "react";

import { useAccion } from "@/lib/use-accion";
import { guardarConfiguracionEmpresa } from "@/server/acciones/empresa";
import { generarCodigoRegistro } from "@/dominio/codificacion";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Input } from "@/components/ui/campos";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  DescripcionTarjeta,
  PieTarjeta,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";

export interface ValoresEmpresa {
  nombreEmpresa: string;
  nombreCorto: string;
  razonSocial: string | null;
  rut: string | null;
  giro: string | null;
  direccion: string | null;
  comuna: string | null;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  prefijoDocumentos: string;
  formatoCodigoRegistro: string;
  piePaginaReportes: string | null;
  diasAlertaVencimientoDefecto: number;
  umbralCumplimientoBajo: number;
}

export function FormularioEmpresa({ empresa }: { empresa: ValoresEmpresa }) {
  const { ejecutar, pendiente, errores } = useAccion(guardarConfiguracionEmpresa);

  const [prefijo, setPrefijo] = useState(empresa.prefijoDocumentos);
  const [formato, setFormato] = useState(empresa.formatoCodigoRegistro);

  const ejemplo = seguro(() =>
    generarCodigoRegistro(formato, {
      prefijo,
      codigoCategoria: "05",
      codigoItem: "5.16",
    }),
  );

  return (
    <form action={ejecutar} className="space-y-5">
      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Identidad</TituloTarjeta>
          <DescripcionTarjeta>
            El nombre y la sigla aparecen en la navegación, en el acceso y en los reportes que
            entregas a tus clientes.
          </DescripcionTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombre de la empresa"
            htmlFor="nombreEmpresa"
            requerido
            error={errores.nombreEmpresa}
          >
            <Input
              id="nombreEmpresa"
              name="nombreEmpresa"
              defaultValue={empresa.nombreEmpresa}
              required
            />
          </Campo>
          <Campo
            etiqueta="Sigla / nombre corto"
            htmlFor="nombreCorto"
            ayuda="Se usa como monograma cuando no hay logo cargado."
            requerido
            error={errores.nombreCorto}
          >
            <Input id="nombreCorto" name="nombreCorto" defaultValue={empresa.nombreCorto} required />
          </Campo>
          <Campo etiqueta="Razón social" htmlFor="razonSocial">
            <Input id="razonSocial" name="razonSocial" defaultValue={empresa.razonSocial ?? ""} />
          </Campo>
          <Campo etiqueta="RUT" htmlFor="rut">
            <Input id="rut" name="rut" defaultValue={empresa.rut ?? ""} />
          </Campo>
          <Campo etiqueta="Giro" htmlFor="giro">
            <Input id="giro" name="giro" defaultValue={empresa.giro ?? ""} />
          </Campo>
          <Campo etiqueta="Teléfono" htmlFor="telefono">
            <Input id="telefono" name="telefono" defaultValue={empresa.telefono ?? ""} />
          </Campo>
          <Campo etiqueta="Correo electrónico" htmlFor="email" error={errores.email}>
            <Input id="email" name="email" type="email" defaultValue={empresa.email ?? ""} />
          </Campo>
          <Campo etiqueta="Sitio web" htmlFor="sitioWeb">
            <Input id="sitioWeb" name="sitioWeb" defaultValue={empresa.sitioWeb ?? ""} />
          </Campo>
          <Campo etiqueta="Dirección" htmlFor="direccion">
            <Input id="direccion" name="direccion" defaultValue={empresa.direccion ?? ""} />
          </Campo>
          <Campo etiqueta="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" defaultValue={empresa.comuna ?? ""} />
          </Campo>
          <Campo
            etiqueta="URL del logo"
            htmlFor="logoUrl"
            ayuda="La carga de archivos llega en la Fase 2. Por ahora puedes pegar una URL."
            className="sm:col-span-2"
          >
            <Input id="logoUrl" name="logoUrl" defaultValue={empresa.logoUrl ?? ""} />
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Colores de la marca</TituloTarjeta>
          <DescripcionTarjeta>
            Se aplican a toda la interfaz al guardar, sin necesidad de recompilar.
          </DescripcionTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-3">
          <SelectorColor
            id="colorPrimario"
            etiqueta="Primario"
            valor={empresa.colorPrimario}
            error={errores.colorPrimario}
          />
          <SelectorColor
            id="colorSecundario"
            etiqueta="Secundario"
            valor={empresa.colorSecundario}
            error={errores.colorSecundario}
          />
          <SelectorColor
            id="colorAcento"
            etiqueta="Acento"
            valor={empresa.colorAcento}
            error={errores.colorAcento}
          />
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Codificación de documentos</TituloTarjeta>
          <DescripcionTarjeta>
            Tu propio esquema de códigos de registro. Marcadores disponibles: {"{prefijo}"},{" "}
            {"{categoria}"}, {"{correlativo}"} y {"{item}"}.
          </DescripcionTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Prefijo"
            htmlFor="prefijoDocumentos"
            requerido
            error={errores.prefijoDocumentos}
          >
            <Input
              id="prefijoDocumentos"
              name="prefijoDocumentos"
              value={prefijo}
              onChange={(evento) => setPrefijo(evento.target.value)}
              required
            />
          </Campo>
          <Campo
            etiqueta="Formato del código"
            htmlFor="formatoCodigoRegistro"
            requerido
            error={errores.formatoCodigoRegistro}
          >
            <Input
              id="formatoCodigoRegistro"
              name="formatoCodigoRegistro"
              value={formato}
              onChange={(evento) => setFormato(evento.target.value)}
              required
            />
          </Campo>
          <div className="sm:col-span-2 rounded-lg bg-fondo px-4 py-3">
            <p className="text-xs text-texto-suave">
              Vista previa para el ítem 5.16 de la categoría 05:
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-texto">{ejemplo}</p>
          </div>
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Parámetros de control</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Días de aviso antes de un vencimiento"
            htmlFor="diasAlertaVencimientoDefecto"
            ayuda="Valor por defecto para boletas, pólizas y permisos."
            error={errores.diasAlertaVencimientoDefecto}
          >
            <Input
              id="diasAlertaVencimientoDefecto"
              name="diasAlertaVencimientoDefecto"
              type="number"
              min={1}
              max={365}
              defaultValue={empresa.diasAlertaVencimientoDefecto}
            />
          </Campo>
          <Campo
            etiqueta="Umbral de cumplimiento bajo (%)"
            htmlFor="umbralCumplimientoBajo"
            ayuda="Bajo este porcentaje el proyecto se marca en rojo o naranjo."
            error={errores.umbralCumplimientoBajo}
          >
            <Input
              id="umbralCumplimientoBajo"
              name="umbralCumplimientoBajo"
              type="number"
              min={1}
              max={100}
              defaultValue={empresa.umbralCumplimientoBajo}
            />
          </Campo>
          <Campo
            etiqueta="Pie de página de los reportes"
            htmlFor="piePaginaReportes"
            className="sm:col-span-2"
          >
            <AreaTexto
              id="piePaginaReportes"
              name="piePaginaReportes"
              rows={2}
              defaultValue={empresa.piePaginaReportes ?? ""}
            />
          </Campo>
        </CuerpoTarjeta>
        <PieTarjeta className="justify-end">
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar configuración"}
          </Boton>
        </PieTarjeta>
      </Tarjeta>
    </form>
  );
}

function SelectorColor({
  id,
  etiqueta,
  valor,
  error,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  error?: string;
}) {
  const [color, setColor] = useState(valor);

  return (
    <Campo etiqueta={etiqueta} htmlFor={id} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(evento) => setColor(evento.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-borde bg-white p-1"
          aria-label={`Selector de color ${etiqueta}`}
        />
        <Input
          id={id}
          name={id}
          value={color}
          onChange={(evento) => setColor(evento.target.value)}
          className="font-mono"
        />
      </div>
    </Campo>
  );
}

function seguro(fn: () => string): string {
  try {
    return fn();
  } catch {
    return "—";
  }
}
