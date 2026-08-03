"use client";

import { useAccion } from "@/lib/use-accion";
import { configurarInstalacion } from "@/server/acciones/instalacion";
import { Boton } from "@/components/ui/boton";
import { Campo, Input } from "@/components/ui/campos";

export function FormularioInstalacion() {
  const { ejecutar, pendiente, errores } = useAccion(configurarInstalacion, {
    redirigirA: () => "/iniciar-sesion",
  });

  return (
    <form action={ejecutar} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-texto-suave uppercase">
          Tu empresa
        </h2>

        <Campo
          etiqueta="Nombre de la empresa"
          htmlFor="nombreEmpresa"
          requerido
          ayuda="Si todavía no defines la marca, pon algo provisorio: lo puedes cambiar después."
          error={errores.nombreEmpresa}
        >
          <Input id="nombreEmpresa" name="nombreEmpresa" defaultValue="[Tu Empresa]" required />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Sigla"
            htmlFor="nombreCorto"
            requerido
            ayuda="Se usa como logo hasta que cargues uno."
            error={errores.nombreCorto}
          >
            <Input id="nombreCorto" name="nombreCorto" defaultValue="TE" maxLength={8} required />
          </Campo>

          <Campo
            etiqueta="Prefijo de documentos"
            htmlFor="prefijoDocumentos"
            requerido
            ayuda="Ej. con «ITO» los registros quedan ITO-05-16."
            error={errores.prefijoDocumentos}
          >
            <Input
              id="prefijoDocumentos"
              name="prefijoDocumentos"
              defaultValue="TE"
              maxLength={8}
              required
            />
          </Campo>
        </div>
      </section>

      <section className="space-y-4 border-t border-borde pt-6">
        <h2 className="text-sm font-semibold tracking-wide text-texto-suave uppercase">
          Tu cuenta de administrador
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" htmlFor="nombre" requerido error={errores.nombre}>
            <Input id="nombre" name="nombre" required />
          </Campo>
          <Campo etiqueta="Apellido" htmlFor="apellido" requerido error={errores.apellido}>
            <Input id="apellido" name="apellido" required />
          </Campo>
        </div>

        <Campo etiqueta="Correo electrónico" htmlFor="email" requerido error={errores.email}>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Contraseña"
            htmlFor="password"
            requerido
            ayuda="Mínimo 8 caracteres."
            error={errores.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Campo>
          <Campo
            etiqueta="Repetir contraseña"
            htmlFor="confirmacion"
            requerido
            error={errores.confirmacion}
          >
            <Input
              id="confirmacion"
              name="confirmacion"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Campo>
        </div>
      </section>

      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente ? "Configurando…" : "Crear mi cuenta y empezar"}
      </Boton>

      <p className="text-center text-xs text-texto-suave">
        Se creará tu plantilla de checklist con 20 categorías y 99 registros, lista para usar.
      </p>
    </form>
  );
}
