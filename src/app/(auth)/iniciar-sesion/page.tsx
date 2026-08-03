import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { instalacionConfigurada } from "@/server/datos/instalacion";
import { Logo } from "@/components/marca/logo";
import { FormularioIngreso } from "./formulario-ingreso";

export const metadata = { title: "Iniciar sesión" };

export default async function PaginaIniciarSesion() {
  // Instalación recién desplegada: no hay a quién iniciarle sesión todavía.
  if (!(await instalacionConfigurada())) redirect("/configuracion-inicial");
  if (await usuarioActual()) redirect("/panel");

  const empresa = await obtenerConfiguracionSegura();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo empresa={empresa} tamano="lg" />
          <p className="text-sm text-texto-suave">
            Inspección Técnica de Obras y Gerenciamiento de Proyectos
          </p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm">
          <h1 className="mb-5 text-lg font-semibold">Iniciar sesión</h1>
          <FormularioIngreso />
        </div>

        <p className="mt-6 text-center text-xs text-texto-suave">
          Acceso exclusivo para el equipo de {empresa.nombreEmpresa}.
        </p>
      </div>
    </main>
  );
}
