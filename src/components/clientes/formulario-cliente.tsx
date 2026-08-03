"use client";

import Link from "next/link";

import { useAccion } from "@/lib/use-accion";
import { crearCliente, actualizarCliente } from "@/server/acciones/clientes";
import type { ResultadoAccion } from "@/server/acciones/resultado";
import { ETIQUETAS_TIPO_CLIENTE, aOpciones } from "@/dominio/etiquetas";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Input, Selector } from "@/components/ui/campos";
import { CuerpoTarjeta, PieTarjeta, Tarjeta, CabeceraTarjeta, TituloTarjeta } from "@/components/ui/tarjeta";

export interface ValoresCliente {
  id?: string;
  nombre: string;
  nombreFantasia: string | null;
  rut: string | null;
  tipo: string;
  contactoNombre: string | null;
  contactoCargo: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  direccion: string | null;
  comuna: string | null;
  region: string | null;
  notas: string | null;
  activo: boolean;
}

export function FormularioCliente({ cliente }: { cliente?: ValoresCliente }) {
  const esEdicion = Boolean(cliente?.id);
  const accion: (estado: ResultadoAccion, datos: FormData) => Promise<ResultadoAccion> = esEdicion
    ? actualizarCliente.bind(null, cliente!.id!)
    : crearCliente;

  const { ejecutar, pendiente, errores } = useAccion(accion, {
    redirigirA: () => (esEdicion ? null : "/clientes"),
  });

  return (
    <form action={ejecutar} className="space-y-5">
      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Identificación</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Razón social"
            htmlFor="nombre"
            requerido
            error={errores.nombre}
            className="sm:col-span-2"
          >
            <Input id="nombre" name="nombre" defaultValue={cliente?.nombre ?? ""} required />
          </Campo>

          <Campo etiqueta="Nombre de fantasía" htmlFor="nombreFantasia" error={errores.nombreFantasia}>
            <Input
              id="nombreFantasia"
              name="nombreFantasia"
              defaultValue={cliente?.nombreFantasia ?? ""}
            />
          </Campo>

          <Campo etiqueta="RUT" htmlFor="rut" ayuda="Ej. 76.123.456-7" error={errores.rut}>
            <Input id="rut" name="rut" defaultValue={cliente?.rut ?? ""} />
          </Campo>

          <Campo etiqueta="Tipo de cliente" htmlFor="tipo" requerido error={errores.tipo}>
            <Selector id="tipo" name="tipo" defaultValue={cliente?.tipo ?? "INMOBILIARIA"}>
              {aOpciones(ETIQUETAS_TIPO_CLIENTE).map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Estado" htmlFor="activo">
            <Selector
              id="activo"
              name="activo"
              defaultValue={cliente?.activo === false ? "false" : "true"}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Selector>
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Contraparte</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre del contacto" htmlFor="contactoNombre">
            <Input
              id="contactoNombre"
              name="contactoNombre"
              defaultValue={cliente?.contactoNombre ?? ""}
            />
          </Campo>
          <Campo etiqueta="Cargo" htmlFor="contactoCargo">
            <Input
              id="contactoCargo"
              name="contactoCargo"
              defaultValue={cliente?.contactoCargo ?? ""}
            />
          </Campo>
          <Campo etiqueta="Correo electrónico" htmlFor="contactoEmail" error={errores.contactoEmail}>
            <Input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              defaultValue={cliente?.contactoEmail ?? ""}
            />
          </Campo>
          <Campo etiqueta="Teléfono" htmlFor="contactoTelefono">
            <Input
              id="contactoTelefono"
              name="contactoTelefono"
              defaultValue={cliente?.contactoTelefono ?? ""}
            />
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Ubicación y notas</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Dirección" htmlFor="direccion" className="sm:col-span-3">
            <Input id="direccion" name="direccion" defaultValue={cliente?.direccion ?? ""} />
          </Campo>
          <Campo etiqueta="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" defaultValue={cliente?.comuna ?? ""} />
          </Campo>
          <Campo etiqueta="Región" htmlFor="region">
            <Input id="region" name="region" defaultValue={cliente?.region ?? ""} />
          </Campo>
          <Campo etiqueta="Notas internas" htmlFor="notas" className="sm:col-span-3">
            <AreaTexto id="notas" name="notas" rows={3} defaultValue={cliente?.notas ?? ""} />
          </Campo>
        </CuerpoTarjeta>
        <PieTarjeta className="justify-end">
          <Boton variante="secundario" asChild>
            <Link href="/clientes">Cancelar</Link>
          </Boton>
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear cliente"}
          </Boton>
        </PieTarjeta>
      </Tarjeta>
    </form>
  );
}
