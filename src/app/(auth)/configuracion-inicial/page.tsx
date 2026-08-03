import { redirect } from "next/navigation";

import { instalacionConfigurada } from "@/server/datos/instalacion";
import { FormularioInstalacion } from "./formulario-instalacion";

export const metadata = { title: "Configuración inicial" };

export default async function PaginaConfiguracionInicial() {
  // Una vez que existe al menos un usuario, esta pantalla queda cerrada.
  if (await instalacionConfigurada()) redirect("/iniciar-sesion");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fondo px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
          <p className="mt-2 text-sm text-texto-suave">
            Esta instalación está vacía. Configura tu empresa y crea tu cuenta de administrador
            para empezar.
          </p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie p-6 shadow-sm">
          <FormularioInstalacion />
        </div>
      </div>
    </main>
  );
}
