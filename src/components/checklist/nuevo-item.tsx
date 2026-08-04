"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { crearItemAdHoc } from "@/server/acciones/items";
import { useAccion } from "@/lib/use-accion";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Input, Selector } from "@/components/ui/campos";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ETIQUETAS_REQUISITO, ETIQUETAS_ROL_PROYECTO } from "@/dominio/etiquetas";
import { ETIQUETAS_FRECUENCIA } from "@/dominio/frecuencias";

const ROLES_OPERATIVOS = ["ITO", "ITO_APOYO", "JEFE_PROYECTO", "SUBGERENTE"] as const;

/**
 * Alta de un registro propio de este proyecto.
 *
 * No toca la plantilla maestra: el ítem nace con `itemPlantillaId = null` y vive
 * solo en este checklist. Es la válvula de escape para lo que un mandante pide
 * y que no está en la metodología estándar.
 */
export function NuevoItem({
  categorias,
}: {
  categorias: { id: string; codigo: string; nombre: string }[];
}) {
  const [abierto, setAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const { ejecutar, pendiente, errores } = useAccion(crearItemAdHoc, {
    alTerminar: (estado) => {
      if (estado.ok) {
        formulario.current?.reset();
        setAbierto(false);
      }
    },
  });

  if (!abierto) {
    return (
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        <Plus className="h-4 w-4" />
        Agregar registro a medida
      </Boton>
    );
  }

  return (
    <Tarjeta className="w-full">
      <form ref={formulario} action={ejecutar} className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Registro a medida</h3>
          <Boton
            type="button"
            variante="fantasma"
            tamano="icono"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Boton>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Categoría" requerido error={errores.categoriaProyectoId}>
            <Selector name="categoriaProyectoId" required>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.codigo} — {categoria.nombre}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Subgrupo" ayuda="Opcional, para agrupar dentro de la categoría">
            <Input name="subgrupo" />
          </Campo>

          <Campo
            etiqueta="Descripción del registro"
            requerido
            error={errores.descripcion}
            className="sm:col-span-2"
          >
            <Input name="descripcion" required placeholder="Ej. Protocolo de ensayo de hermeticidad" />
          </Campo>

          <Campo etiqueta="Frecuencia">
            <Selector name="frecuencia" defaultValue="SEGUN_REQUERIMIENTO">
              {Object.entries(ETIQUETAS_FRECUENCIA).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Código de registro" ayuda="Se genera solo si lo dejas vacío">
            <Input name="codigoRegistro" />
          </Campo>

          <Campo etiqueta="Responsable">
            <Selector name="responsableRol" defaultValue="ITO">
              {ROLES_OPERATIVOS.map((rol) => (
                <option key={rol} value={rol}>
                  {ETIQUETAS_ROL_PROYECTO[rol]}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Revisa">
            <Selector name="revisorRol" defaultValue="JEFE_PROYECTO">
              {ROLES_OPERATIVOS.map((rol) => (
                <option key={rol} value={rol}>
                  {ETIQUETAS_ROL_PROYECTO[rol]}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Respaldo digital">
            <Selector name="requiereRespaldoDigital" defaultValue="REQUERIDO">
              {Object.entries(ETIQUETAS_REQUISITO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Respaldo físico">
            <Selector name="requiereRespaldoFisico" defaultValue="NO_APLICA">
              {Object.entries(ETIQUETAS_REQUISITO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>

          <Campo etiqueta="Instrucciones" className="sm:col-span-2">
            <AreaTexto name="instrucciones" placeholder="Cómo se usa este registro" />
          </Campo>
        </div>

        <div className="flex items-center gap-2">
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Agregando…" : "Agregar registro"}
          </Boton>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-texto">
            <input
              type="checkbox"
              name="visibleParaCliente"
              defaultChecked
              className="h-4 w-4 rounded border-borde"
            />
            Visible para el cliente
          </label>
        </div>
      </form>
    </Tarjeta>
  );
}
