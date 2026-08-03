"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ingresar, type EstadoIngreso } from "@/server/acciones/sesion";
import { Boton } from "@/components/ui/boton";
import { Campo, Input } from "@/components/ui/campos";

const ESTADO_INICIAL: EstadoIngreso = {};

export function FormularioIngreso() {
  const [estado, accion] = useActionState(ingresar, ESTADO_INICIAL);

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Correo electrónico" htmlFor="email" requerido>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu.correo@empresa.cl"
          required
        />
      </Campo>

      <Campo etiqueta="Contraseña" htmlFor="password" requerido>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Campo>

      {estado.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {estado.error}
        </p>
      )}

      <BotonIngresar />
    </form>
  );
}

function BotonIngresar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" className="w-full" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Boton>
  );
}
