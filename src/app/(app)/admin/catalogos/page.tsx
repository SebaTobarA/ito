import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { obtenerCatalogosAgrupados, obtenerEspecialidades } from "@/server/datos/catalogos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { GestorCatalogos } from "@/components/admin/gestor-catalogos";
import { GestorEspecialidades } from "@/components/admin/gestor-especialidades";

export const metadata = { title: "Catálogos" };

export default async function PaginaCatalogos() {
  const usuario = (await usuarioActual())!;
  if (!puede(usuario, "catalogo.gestionar")) redirect("/panel");

  const [grupos, especialidades] = await Promise.all([
    obtenerCatalogosAgrupados(),
    obtenerEspecialidades(),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Catálogos"
        descripcion="Las listas que alimentan la guía de planificación y los registros de obra. Nada de esto está fijo en el código."
        migas={[{ etiqueta: "Administración" }, { etiqueta: "Catálogos" }]}
      />

      <div className="mb-4 rounded-lg border border-borde bg-fondo px-4 py-3 text-sm text-texto-suave">
        Las opciones no se borran, se desactivan: una desactivada deja de ofrecerse en proyectos
        nuevos, pero los proyectos que ya la usan la conservan y su historial sigue siendo legible.
      </div>

      <div className="space-y-4">
        <GestorEspecialidades especialidades={especialidades} />
        <GestorCatalogos grupos={grupos} />
      </div>
    </>
  );
}
