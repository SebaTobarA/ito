"use client";

import Link from "next/link";

import { useAccion } from "@/lib/use-accion";
import {
  actualizarProyecto,
  crearProyecto,
  type ResultadoProyecto,
} from "@/server/acciones/proyectos";
import { ETIQUETAS_ESTADO_PROYECTO, ETIQUETAS_MONEDA, aOpciones } from "@/dominio/etiquetas";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Input, Selector } from "@/components/ui/campos";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  DescripcionTarjeta,
  PieTarjeta,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";

export interface OpcionSimple {
  id: string;
  etiqueta: string;
}

export interface ValoresProyecto {
  id?: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  constructoraNombre: string | null;
  constructoraRut: string | null;
  centroCosto: string | null;
  direccion: string | null;
  comuna: string | null;
  region: string | null;
  tipoObra: string | null;
  superficieM2: string | null;
  numeroUnidades: number | null;
  montoContrato: string | null;
  moneda: string;
  fechaInicio: string | null;
  fechaTerminoEstimada: string | null;
  estado: string;
  notas: string | null;
  itoId: string | null;
  jefeProyectoId: string | null;
  subgerenteId: string | null;
}

export function FormularioProyecto({
  proyecto,
  clientes,
  usuarios,
  puedeAsignarEquipo,
}: {
  proyecto?: ValoresProyecto;
  clientes: OpcionSimple[];
  usuarios: { itos: OpcionSimple[]; jefes: OpcionSimple[]; subgerentes: OpcionSimple[] };
  puedeAsignarEquipo: boolean;
}) {
  const esEdicion = Boolean(proyecto?.id);
  const accion: (estado: ResultadoProyecto, datos: FormData) => Promise<ResultadoProyecto> =
    esEdicion ? actualizarProyecto.bind(null, proyecto!.id!) : crearProyecto;

  const { ejecutar, pendiente, errores } = useAccion(accion, {
    redirigirA: (estado) =>
      esEdicion || !estado.proyectoId ? null : `/proyectos/${estado.proyectoId}`,
  });

  return (
    <form action={ejecutar} className="space-y-5">
      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Identificación del proyecto</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Código / centro de costo"
            htmlFor="codigo"
            requerido
            ayuda="Código interno único. Ej. P-2026-001"
            error={errores.codigo}
          >
            <Input id="codigo" name="codigo" defaultValue={proyecto?.codigo ?? ""} required />
          </Campo>

          <Campo etiqueta="Cliente mandante" htmlFor="clienteId" requerido error={errores.clienteId}>
            <Selector id="clienteId" name="clienteId" defaultValue={proyecto?.clienteId ?? ""} required>
              <option value="">Selecciona un cliente…</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo
            etiqueta="Nombre del proyecto"
            htmlFor="nombre"
            requerido
            error={errores.nombre}
            className="sm:col-span-2"
          >
            <Input id="nombre" name="nombre" defaultValue={proyecto?.nombre ?? ""} required />
          </Campo>

          <Campo etiqueta="Empresa constructora ejecutora" htmlFor="constructoraNombre">
            <Input
              id="constructoraNombre"
              name="constructoraNombre"
              placeholder="Si es distinta del cliente"
              defaultValue={proyecto?.constructoraNombre ?? ""}
            />
          </Campo>

          <Campo etiqueta="RUT de la constructora" htmlFor="constructoraRut">
            <Input
              id="constructoraRut"
              name="constructoraRut"
              defaultValue={proyecto?.constructoraRut ?? ""}
            />
          </Campo>

          <Campo etiqueta="Centro de costo" htmlFor="centroCosto">
            <Input id="centroCosto" name="centroCosto" defaultValue={proyecto?.centroCosto ?? ""} />
          </Campo>

          <Campo etiqueta="Estado" htmlFor="estado">
            <Selector id="estado" name="estado" defaultValue={proyecto?.estado ?? "PLANIFICACION"}>
              {aOpciones(ETIQUETAS_ESTADO_PROYECTO).map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Obra</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Dirección" htmlFor="direccion" className="sm:col-span-3">
            <Input id="direccion" name="direccion" defaultValue={proyecto?.direccion ?? ""} />
          </Campo>
          <Campo etiqueta="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" defaultValue={proyecto?.comuna ?? ""} />
          </Campo>
          <Campo etiqueta="Región" htmlFor="region">
            <Input id="region" name="region" defaultValue={proyecto?.region ?? ""} />
          </Campo>
          <Campo etiqueta="Tipo de obra" htmlFor="tipoObra" ayuda="Ej. edificación en altura">
            <Input id="tipoObra" name="tipoObra" defaultValue={proyecto?.tipoObra ?? ""} />
          </Campo>
          <Campo etiqueta="Superficie (m²)" htmlFor="superficieM2" error={errores.superficieM2}>
            <Input
              id="superficieM2"
              name="superficieM2"
              type="number"
              step="0.01"
              min="0"
              defaultValue={proyecto?.superficieM2 ?? ""}
            />
          </Campo>
          <Campo etiqueta="N.º de unidades" htmlFor="numeroUnidades">
            <Input
              id="numeroUnidades"
              name="numeroUnidades"
              type="number"
              min="0"
              defaultValue={proyecto?.numeroUnidades ?? ""}
            />
          </Campo>
          <Campo etiqueta="Monto de contrato" htmlFor="montoContrato" error={errores.montoContrato}>
            <Input
              id="montoContrato"
              name="montoContrato"
              type="number"
              step="0.01"
              min="0"
              defaultValue={proyecto?.montoContrato ?? ""}
            />
          </Campo>
          <Campo etiqueta="Moneda" htmlFor="moneda">
            <Selector id="moneda" name="moneda" defaultValue={proyecto?.moneda ?? "CLP"}>
              {aOpciones(ETIQUETAS_MONEDA).map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Fecha de inicio" htmlFor="fechaInicio" error={errores.fechaInicio}>
            <Input
              id="fechaInicio"
              name="fechaInicio"
              type="date"
              defaultValue={proyecto?.fechaInicio ?? ""}
            />
          </Campo>
          <Campo
            etiqueta="Término estimado"
            htmlFor="fechaTerminoEstimada"
            error={errores.fechaTerminoEstimada}
          >
            <Input
              id="fechaTerminoEstimada"
              name="fechaTerminoEstimada"
              type="date"
              defaultValue={proyecto?.fechaTerminoEstimada ?? ""}
            />
          </Campo>
        </CuerpoTarjeta>
      </Tarjeta>

      {puedeAsignarEquipo && (
        <Tarjeta>
          <CabeceraTarjeta>
            <TituloTarjeta>Equipo a cargo</TituloTarjeta>
            <DescripcionTarjeta>
              Define quién puede acceder al proyecto. Los cambios de equipo quedan registrados en el
              historial, no reemplazan lo anterior.
            </DescripcionTarjeta>
          </CabeceraTarjeta>
          <CuerpoTarjeta className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="ITO a cargo" htmlFor="itoId">
              <SelectorUsuario id="itoId" opciones={usuarios.itos} valor={proyecto?.itoId} />
            </Campo>
            <Campo etiqueta="Jefe de Proyecto" htmlFor="jefeProyectoId">
              <SelectorUsuario
                id="jefeProyectoId"
                opciones={usuarios.jefes}
                valor={proyecto?.jefeProyectoId}
              />
            </Campo>
            <Campo etiqueta="Subgerente / responsable" htmlFor="subgerenteId">
              <SelectorUsuario
                id="subgerenteId"
                opciones={usuarios.subgerentes}
                valor={proyecto?.subgerenteId}
              />
            </Campo>
          </CuerpoTarjeta>
        </Tarjeta>
      )}

      <Tarjeta>
        <CuerpoTarjeta>
          <Campo etiqueta="Notas" htmlFor="notas">
            <AreaTexto id="notas" name="notas" rows={3} defaultValue={proyecto?.notas ?? ""} />
          </Campo>
        </CuerpoTarjeta>
        <PieTarjeta className="justify-between">
          {!esEdicion && (
            <p className="text-xs text-texto-suave">
              Al crear el proyecto se generará automáticamente su checklist de calidad completo a
              partir de la plantilla activa.
            </p>
          )}
          <div className="ml-auto flex gap-2">
            <Boton variante="secundario" asChild>
              <Link href={esEdicion ? `/proyectos/${proyecto!.id}` : "/proyectos"}>Cancelar</Link>
            </Boton>
            <Boton type="submit" disabled={pendiente}>
              {pendiente
                ? esEdicion
                  ? "Guardando…"
                  : "Creando checklist…"
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear proyecto"}
            </Boton>
          </div>
        </PieTarjeta>
      </Tarjeta>
    </form>
  );
}

function SelectorUsuario({
  id,
  opciones,
  valor,
}: {
  id: string;
  opciones: OpcionSimple[];
  valor?: string | null;
}) {
  return (
    <Selector id={id} name={id} defaultValue={valor ?? ""}>
      <option value="">Sin asignar</option>
      {opciones.map((opcion) => (
        <option key={opcion.id} value={opcion.id}>
          {opcion.etiqueta}
        </option>
      ))}
    </Selector>
  );
}
