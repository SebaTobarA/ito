"use client";

import { useState } from "react";

import { useAccion } from "@/lib/use-accion";
import { actualizarUsuario, crearUsuario } from "@/server/acciones/usuarios";
import type { ResultadoAccion } from "@/server/acciones/resultado";
import { ETIQUETAS_ROL_GLOBAL } from "@/dominio/etiquetas";
import { Boton } from "@/components/ui/boton";
import { Campo, Input, Selector } from "@/components/ui/campos";

const ROLES_ASIGNABLES = ["ADMIN", "SUBGERENTE", "JEFE_PROYECTO", "ITO"] as const;

export interface ValoresUsuario {
  id?: string;
  email: string;
  nombre: string;
  apellido: string;
  cargo: string | null;
  telefono: string | null;
  rolGlobal: string;
  activo: boolean;
}

export function FormularioUsuario({
  usuario,
  alCerrar,
}: {
  usuario?: ValoresUsuario;
  alCerrar?: () => void;
}) {
  const esEdicion = Boolean(usuario?.id);
  const accion: (estado: ResultadoAccion, datos: FormData) => Promise<ResultadoAccion> = esEdicion
    ? actualizarUsuario.bind(null, usuario!.id!)
    : crearUsuario;

  const { ejecutar, pendiente, errores } = useAccion(accion, { alTerminar: () => alCerrar?.() });
  const [cambiarClave, setCambiarClave] = useState(!esEdicion);

  return (
    <form action={ejecutar} className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre" htmlFor="nombre" requerido error={errores.nombre}>
        <Input id="nombre" name="nombre" defaultValue={usuario?.nombre ?? ""} required />
      </Campo>
      <Campo etiqueta="Apellido" htmlFor="apellido" requerido error={errores.apellido}>
        <Input id="apellido" name="apellido" defaultValue={usuario?.apellido ?? ""} required />
      </Campo>
      <Campo etiqueta="Correo electrónico" htmlFor="email" requerido error={errores.email}>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={usuario?.email ?? ""}
          required
          readOnly={esEdicion}
          className={esEdicion ? "bg-fondo" : undefined}
        />
      </Campo>
      <Campo etiqueta="Cargo" htmlFor="cargo">
        <Input id="cargo" name="cargo" defaultValue={usuario?.cargo ?? ""} />
      </Campo>
      <Campo etiqueta="Teléfono" htmlFor="telefono">
        <Input id="telefono" name="telefono" defaultValue={usuario?.telefono ?? ""} />
      </Campo>
      <Campo etiqueta="Rol" htmlFor="rolGlobal" requerido error={errores.rolGlobal}>
        <Selector id="rolGlobal" name="rolGlobal" defaultValue={usuario?.rolGlobal ?? "ITO"}>
          {ROLES_ASIGNABLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETAS_ROL_GLOBAL[rol]}
            </option>
          ))}
        </Selector>
      </Campo>
      <Campo etiqueta="Estado" htmlFor="activo">
        <Selector id="activo" name="activo" defaultValue={usuario?.activo === false ? "false" : "true"}>
          <option value="true">Activo</option>
          <option value="false">Desactivado</option>
        </Selector>
      </Campo>

      <div className="sm:col-span-2">
        {esEdicion && !cambiarClave ? (
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            onClick={() => setCambiarClave(true)}
          >
            Restablecer contraseña
          </Boton>
        ) : (
          <Campo
            etiqueta={esEdicion ? "Nueva contraseña" : "Contraseña inicial"}
            htmlFor="password"
            requerido={!esEdicion}
            ayuda="Mínimo 8 caracteres. El usuario debería cambiarla al ingresar."
            error={errores.password}
          >
            <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" />
          </Campo>
        )}
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        {alCerrar && (
          <Boton type="button" variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear usuario"}
        </Boton>
      </div>
    </form>
  );
}
