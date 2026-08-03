"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { ETIQUETAS_ROL_GLOBAL } from "@/dominio/etiquetas";
import { Boton } from "@/components/ui/boton";
import { CabeceraTarjeta, Insignia, Tarjeta, TituloTarjeta } from "@/components/ui/tarjeta";
import { FormularioUsuario, type ValoresUsuario } from "./formulario-usuario";

export function ListaUsuarios({ usuarios }: { usuarios: ValoresUsuario[] }) {
  const [editando, setEditando] = useState<ValoresUsuario | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <div className="space-y-5">
      {!creando && !editando && (
        <div className="flex justify-end">
          <Boton onClick={() => setCreando(true)}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Boton>
        </div>
      )}

      {(creando || editando) && (
        <Tarjeta>
          <CabeceraTarjeta>
            <TituloTarjeta>{editando ? "Editar usuario" : "Nuevo usuario"}</TituloTarjeta>
          </CabeceraTarjeta>
          <div className="px-5 py-4">
            <FormularioUsuario
              key={editando?.id ?? "nuevo"}
              usuario={editando ?? undefined}
              alCerrar={() => {
                setEditando(null);
                setCreando(false);
              }}
            />
          </div>
        </Tarjeta>
      )}

      <Tarjeta>
        <ul className="divide-y divide-borde">
          {usuarios.map((usuario) => (
            <li
              key={usuario.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-texto">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <p className="truncate text-sm text-texto-suave">{usuario.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Insignia tono="marca">
                  {ETIQUETAS_ROL_GLOBAL[usuario.rolGlobal as keyof typeof ETIQUETAS_ROL_GLOBAL]}
                </Insignia>
                {!usuario.activo && <Insignia tono="peligro">Desactivado</Insignia>}
                <Boton
                  variante="fantasma"
                  tamano="icono"
                  onClick={() => {
                    setCreando(false);
                    setEditando(usuario);
                  }}
                  aria-label={`Editar ${usuario.nombre}`}
                >
                  <Pencil className="h-4 w-4" />
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}
