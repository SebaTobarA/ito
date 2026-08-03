"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { useAccion } from "@/lib/use-accion";
import {
  alternarItemPlantilla,
  guardarItemPlantilla,
  guardarCategoriaPlantilla,
} from "@/server/acciones/plantillas";
import type { ResultadoAccion } from "@/server/acciones/resultado";
import { ABREVIATURAS_FRECUENCIA, ETIQUETAS_FRECUENCIA } from "@/dominio/frecuencias";
import { ETIQUETAS_REQUISITO, ETIQUETAS_ROL_PROYECTO, aOpciones } from "@/dominio/etiquetas";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Input, Selector } from "@/components/ui/campos";
import { Insignia, Tarjeta } from "@/components/ui/tarjeta";

export interface ItemPlantillaVista {
  id: string;
  categoriaId: string;
  codigo: string;
  descripcion: string;
  codigoRegistro: string | null;
  subgrupo: string | null;
  instrucciones: string | null;
  frecuencia: string;
  responsableRol: string;
  revisorRol: string;
  requiereRespaldoDigital: string;
  requiereRespaldoFisico: string;
  controlaVencimiento: boolean;
  aplicaPorDefecto: boolean;
  visibleParaCliente: boolean;
  orden: number;
  activo: boolean;
}

export interface CategoriaPlantillaVista {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activa: boolean;
  items: ItemPlantillaVista[];
}

const ROLES = ["ITO", "ITO_APOYO", "JEFE_PROYECTO", "SUBGERENTE"] as const;

export function GestorPlantilla({
  plantillaId,
  categorias,
  editable,
}: {
  plantillaId: string;
  categorias: CategoriaPlantillaVista[];
  editable: boolean;
}) {
  const [abierta, setAbierta] = useState<string | null>(categorias[0]?.id ?? null);
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemPlantillaVista | null>(null);
  const [creandoEn, setCreandoEn] = useState<string | null>(null);
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex justify-end">
          <Boton variante="secundario" tamano="sm" onClick={() => setCreandoCategoria((v) => !v)}>
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Boton>
        </div>
      )}

      {creandoCategoria && (
        <Tarjeta className="p-4">
          <FormularioCategoria
            plantillaId={plantillaId}
            ordenSugerido={categorias.length}
            alCerrar={() => setCreandoCategoria(false)}
          />
        </Tarjeta>
      )}

      {categorias.map((categoria) => {
        const expandida = abierta === categoria.id;

        return (
          <Tarjeta key={categoria.id}>
            <button
              type="button"
              onClick={() => setAbierta(expandida ? null : categoria.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fondo"
            >
              {expandida ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-texto-suave" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-texto-suave" />
              )}
              <span className="font-mono text-xs text-texto-suave">{categoria.codigo}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-texto">
                {categoria.nombre}
              </span>
              {!categoria.activa && <Insignia tono="neutro">Inactiva</Insignia>}
              <Insignia>{categoria.items.length} ítems</Insignia>
            </button>

            {expandida && (
              <div className="border-t border-borde">
                {categoria.descripcion && (
                  <p className="px-4 py-3 text-sm text-texto-suave">{categoria.descripcion}</p>
                )}

                <ul className="divide-y divide-borde">
                  {categoria.items.map((item) => (
                    <li key={item.id}>
                      {itemEnEdicion?.id === item.id ? (
                        <div className="bg-fondo px-4 py-4">
                          <FormularioItem
                            item={item}
                            categoriaId={categoria.id}
                            alCerrar={() => setItemEnEdicion(null)}
                          />
                        </div>
                      ) : (
                        <FilaItem
                          item={item}
                          editable={editable}
                          alEditar={() => setItemEnEdicion(item)}
                        />
                      )}
                    </li>
                  ))}
                </ul>

                {editable && (
                  <div className="border-t border-borde px-4 py-3">
                    {creandoEn === categoria.id ? (
                      <FormularioItem
                        categoriaId={categoria.id}
                        ordenSugerido={categoria.items.length}
                        codigoSugerido={siguienteCodigo(categoria)}
                        alCerrar={() => setCreandoEn(null)}
                      />
                    ) : (
                      <Boton variante="secundario" tamano="sm" onClick={() => setCreandoEn(categoria.id)}>
                        <Plus className="h-4 w-4" />
                        Agregar ítem a esta categoría
                      </Boton>
                    )}
                  </div>
                )}
              </div>
            )}
          </Tarjeta>
        );
      })}
    </div>
  );
}

function FilaItem({
  item,
  editable,
  alEditar,
}: {
  item: ItemPlantillaVista;
  editable: boolean;
  alEditar: () => void;
}) {
  const [pendiente, iniciarTransicion] = useTransition();

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${item.activo ? "" : "opacity-50"}`}>
      <span className="w-12 shrink-0 pt-0.5 font-mono text-xs text-texto-suave">{item.codigo}</span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-texto">{item.descripcion}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.codigoRegistro && (
            <span className="rounded bg-fondo px-1.5 py-0.5 font-mono text-[11px] text-texto-suave">
              {item.codigoRegistro}
            </span>
          )}
          <Insignia>
            {ABREVIATURAS_FRECUENCIA[item.frecuencia as keyof typeof ABREVIATURAS_FRECUENCIA]}
          </Insignia>
          <Insignia tono="marca">
            {ETIQUETAS_ROL_PROYECTO[item.responsableRol as keyof typeof ETIQUETAS_ROL_PROYECTO]}
          </Insignia>
          {item.controlaVencimiento && <Insignia tono="aviso">Controla vencimiento</Insignia>}
          {item.subgrupo && <span className="text-[11px] text-texto-suave">{item.subgrupo}</span>}
        </div>
      </div>

      {editable && (
        <div className="flex shrink-0 items-center gap-1">
          <Boton variante="fantasma" tamano="icono" onClick={alEditar} aria-label="Editar ítem">
            <Pencil className="h-4 w-4" />
          </Boton>
          <Boton
            variante="fantasma"
            tamano="sm"
            disabled={pendiente}
            onClick={() =>
              iniciarTransicion(async () => {
                const resultado = await alternarItemPlantilla(item.id);
                if (resultado.error) toast.error(resultado.error);
                else if (resultado.mensaje) toast.success(resultado.mensaje);
              })
            }
          >
            {item.activo ? "Desactivar" : "Activar"}
          </Boton>
        </div>
      )}
    </div>
  );
}

function FormularioCategoria({
  plantillaId,
  ordenSugerido,
  alCerrar,
}: {
  plantillaId: string;
  ordenSugerido: number;
  alCerrar: () => void;
}) {
  const accion: (estado: ResultadoAccion, datos: FormData) => Promise<ResultadoAccion> =
    guardarCategoriaPlantilla.bind(null, null);
  const { ejecutar, pendiente, errores } = useAccion(accion, { alTerminar: alCerrar });

  return (
    <form action={ejecutar} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="plantillaId" value={plantillaId} />
      <input type="hidden" name="orden" value={ordenSugerido} />
      <input type="hidden" name="activa" value="true" />

      <Campo etiqueta="Código" htmlFor="codigo" requerido error={errores.codigo}>
        <Input id="codigo" name="codigo" placeholder="20" required />
      </Campo>
      <Campo etiqueta="Nombre" htmlFor="nombre" requerido error={errores.nombre} className="sm:col-span-3">
        <Input id="nombre" name="nombre" required />
      </Campo>
      <Campo etiqueta="Descripción" htmlFor="descripcion" className="sm:col-span-4">
        <Input id="descripcion" name="descripcion" />
      </Campo>
      <div className="flex justify-end gap-2 sm:col-span-4">
        <Boton type="button" variante="secundario" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Crear categoría"}
        </Boton>
      </div>
    </form>
  );
}

function FormularioItem({
  item,
  categoriaId,
  ordenSugerido,
  codigoSugerido,
  alCerrar,
}: {
  item?: ItemPlantillaVista;
  categoriaId: string;
  ordenSugerido?: number;
  codigoSugerido?: string;
  alCerrar: () => void;
}) {
  const accion: (estado: ResultadoAccion, datos: FormData) => Promise<ResultadoAccion> =
    guardarItemPlantilla.bind(null, item?.id ?? null);
  const { ejecutar, pendiente, errores } = useAccion(accion, { alTerminar: alCerrar });

  return (
    <form action={ejecutar} className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="categoriaId" value={categoriaId} />
      <input type="hidden" name="orden" value={item?.orden ?? ordenSugerido ?? 0} />
      <input type="hidden" name="activo" value={item ? String(item.activo) : "true"} />

      <Campo etiqueta="Código" htmlFor="codigo" requerido error={errores.codigo}>
        <Input
          id="codigo"
          name="codigo"
          defaultValue={item?.codigo ?? codigoSugerido ?? ""}
          required
        />
      </Campo>

      <Campo
        etiqueta="Descripción del registro"
        htmlFor="descripcion"
        requerido
        error={errores.descripcion}
        className="sm:col-span-5"
      >
        <Input id="descripcion" name="descripcion" defaultValue={item?.descripcion ?? ""} required />
      </Campo>

      <Campo etiqueta="Código de registro" htmlFor="codigoRegistro" className="sm:col-span-2">
        <Input
          id="codigoRegistro"
          name="codigoRegistro"
          defaultValue={item?.codigoRegistro ?? ""}
          className="font-mono"
        />
      </Campo>

      <Campo etiqueta="Subgrupo" htmlFor="subgrupo" className="sm:col-span-2">
        <Input id="subgrupo" name="subgrupo" defaultValue={item?.subgrupo ?? ""} />
      </Campo>

      <Campo etiqueta="Frecuencia" htmlFor="frecuencia" className="sm:col-span-2">
        <Selector
          id="frecuencia"
          name="frecuencia"
          defaultValue={item?.frecuencia ?? "SEGUN_REQUERIMIENTO"}
        >
          {aOpciones(ETIQUETAS_FRECUENCIA).map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo etiqueta="Responsable" htmlFor="responsableRol" className="sm:col-span-3">
        <Selector id="responsableRol" name="responsableRol" defaultValue={item?.responsableRol ?? "ITO"}>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETAS_ROL_PROYECTO[rol]}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo etiqueta="Revisor" htmlFor="revisorRol" className="sm:col-span-3">
        <Selector id="revisorRol" name="revisorRol" defaultValue={item?.revisorRol ?? "JEFE_PROYECTO"}>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETAS_ROL_PROYECTO[rol]}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo etiqueta="Respaldo digital" htmlFor="requiereRespaldoDigital" className="sm:col-span-3">
        <Selector
          id="requiereRespaldoDigital"
          name="requiereRespaldoDigital"
          defaultValue={item?.requiereRespaldoDigital ?? "REQUERIDO"}
        >
          {aOpciones(ETIQUETAS_REQUISITO).map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo
        etiqueta="Respaldo físico firmado"
        htmlFor="requiereRespaldoFisico"
        className="sm:col-span-3"
      >
        <Selector
          id="requiereRespaldoFisico"
          name="requiereRespaldoFisico"
          defaultValue={item?.requiereRespaldoFisico ?? "NO_APLICA"}
        >
          {aOpciones(ETIQUETAS_REQUISITO).map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      <Campo
        etiqueta="Instrucciones de uso del registro"
        htmlFor="instrucciones"
        className="sm:col-span-6"
      >
        <AreaTexto
          id="instrucciones"
          name="instrucciones"
          rows={2}
          defaultValue={item?.instrucciones ?? ""}
        />
      </Campo>

      <div className="flex flex-wrap gap-4 sm:col-span-6">
        <Casilla
          name="controlaVencimiento"
          etiqueta="Controla fecha de vencimiento"
          defecto={item?.controlaVencimiento ?? false}
        />
        <Casilla
          name="aplicaPorDefecto"
          etiqueta="Aplica por defecto a los proyectos nuevos"
          defecto={item?.aplicaPorDefecto ?? true}
        />
        <Casilla
          name="visibleParaCliente"
          etiqueta="Visible en el futuro portal de cliente"
          defecto={item?.visibleParaCliente ?? true}
        />
      </div>

      <div className="flex justify-end gap-2 sm:col-span-6">
        <Boton type="button" variante="secundario" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : item ? "Guardar ítem" : "Crear ítem"}
        </Boton>
      </div>
    </form>
  );
}

function Casilla({
  name,
  etiqueta,
  defecto,
}: {
  name: string;
  etiqueta: string;
  defecto: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-texto">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defecto}
        className="h-4 w-4 rounded border-borde"
      />
      {etiqueta}
    </label>
  );
}

/** "5.38" → "5.39" */
function siguienteCodigo(categoria: CategoriaPlantillaVista): string {
  const base = String(Number(categoria.codigo));
  const maximo = categoria.items.reduce((mayor, item) => {
    const numero = Number(item.codigo.split(".").pop());
    return Number.isFinite(numero) && numero > mayor ? numero : mayor;
  }, 0);
  return `${base}.${maximo + 1}`;
}
