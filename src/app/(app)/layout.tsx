import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { ETIQUETAS_ROL_GLOBAL } from "@/dominio/etiquetas";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { Navegacion, type EntradaMenu } from "@/components/layout/navegacion";
import { RegistroPwa } from "@/components/layout/registro-pwa";

export default async function LayoutAplicacion({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/iniciar-sesion");

  const empresa = await obtenerConfiguracionSegura();

  const entradas: EntradaMenu[] = [
    { href: "/panel", etiqueta: "Panel", icono: "panel" },
    { href: "/proyectos", etiqueta: "Proyectos", icono: "proyectos" },
    { href: "/clientes", etiqueta: "Clientes", icono: "clientes" },
  ];

  const entradasAdmin: EntradaMenu[] = [];
  if (puede(usuario, "usuario.gestionar")) {
    entradasAdmin.push({ href: "/admin/usuarios", etiqueta: "Usuarios", icono: "usuarios" });
  }
  if (puede(usuario, "plantilla.gestionar")) {
    entradasAdmin.push({ href: "/admin/plantillas", etiqueta: "Plantillas", icono: "plantillas" });
  }
  if (puede(usuario, "catalogo.gestionar")) {
    entradasAdmin.push({ href: "/admin/catalogos", etiqueta: "Catálogos", icono: "catalogos" });
  }
  if (puede(usuario, "empresa.configurar")) {
    entradasAdmin.push({ href: "/admin/empresa", etiqueta: "Empresa", icono: "empresa" });
  }

  return (
    <div className="min-h-screen">
      <RegistroPwa />
      <Navegacion
        empresa={empresa}
        entradas={entradas}
        entradasAdmin={entradasAdmin}
        usuario={{
          nombreCompleto: usuario.nombreCompleto || usuario.email,
          rol: ETIQUETAS_ROL_GLOBAL[usuario.rolGlobal],
        }}
      />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
