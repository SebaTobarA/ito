import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { filtroClientes } from "@/server/datos/alcance";
import { opcionesEquipo } from "@/server/datos/usuarios";
import { obtenerPlantillaActiva } from "@/server/servicios/clonar-plantilla";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioProyecto } from "@/components/proyectos/formulario-proyecto";
import { Boton } from "@/components/ui/boton";
import { EstadoVacio, Tarjeta } from "@/components/ui/tarjeta";

export const metadata = { title: "Nuevo proyecto" };

export default async function PaginaNuevoProyecto() {
  const usuario = (await usuarioActual())!;
  if (!puede(usuario, "proyecto.crear")) redirect("/proyectos");

  const [clientes, usuarios, plantilla] = await Promise.all([
    prisma.cliente.findMany({
      where: { AND: [{ activo: true }, filtroClientes(usuario)] },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    opcionesEquipo(),
    obtenerPlantillaActiva(),
  ]);

  if (!plantilla) {
    return (
      <>
        <EncabezadoPagina titulo="Nuevo proyecto" />
        <Tarjeta>
          <EstadoVacio
            titulo="No hay una plantilla de checklist activa"
            descripcion="Antes de crear un proyecto tiene que existir una plantilla publicada: es la que se clona para generar el checklist de calidad."
          >
            <Boton asChild>
              <Link href="/admin/plantillas">Ir a Plantillas</Link>
            </Boton>
          </EstadoVacio>
        </Tarjeta>
      </>
    );
  }

  if (clientes.length === 0) {
    return (
      <>
        <EncabezadoPagina titulo="Nuevo proyecto" />
        <Tarjeta>
          <EstadoVacio
            titulo="Todavía no hay clientes"
            descripcion="Un proyecto siempre pertenece a un cliente mandante. Crea primero el cliente."
          >
            <Boton asChild>
              <Link href="/clientes/nuevo">Crear cliente</Link>
            </Boton>
          </EstadoVacio>
        </Tarjeta>
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo proyecto"
        descripcion={`Se clonará el checklist de la plantilla "${plantilla.nombre}" (versión ${plantilla.version}).`}
        migas={[{ etiqueta: "Proyectos", href: "/proyectos" }, { etiqueta: "Nuevo" }]}
      />

      <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          El checklist se genera una sola vez al crear el proyecto. Cambios posteriores en la
          plantilla maestra no afectan a los proyectos ya creados.
        </p>
      </div>

      <FormularioProyecto
        clientes={clientes.map((c) => ({ id: c.id, etiqueta: c.nombre }))}
        usuarios={usuarios}
        puedeAsignarEquipo={puede(usuario, "proyecto.asignarEquipo")}
      />
    </>
  );
}
