import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { contextoProyecto, filtroProyectos } from "@/server/datos/alcance";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Boton } from "@/components/ui/boton";
import {
  PestanasProyecto,
  type PestanaProyecto,
} from "@/components/proyectos/pestanas-proyecto";

/**
 * Marco común de todas las secciones de un proyecto.
 *
 * Centraliza el encabezado y las pestañas para que cada sección solo renderice
 * su contenido. A partir de la Fase 3 las pestañas dependerán de los servicios
 * contratados del proyecto, y este es el punto donde se resuelven.
 */
export default async function LayoutProyecto({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const usuario = (await usuarioActual())!;

  const proyecto = await prisma.proyecto.findFirst({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      comuna: true,
      cliente: { select: { nombre: true } },
    },
  });
  if (!proyecto) notFound();

  const contexto = await contextoProyecto(usuario, proyectoId);
  const puedeEditar = puede(usuario, "proyecto.editar", contexto ?? {});

  const pestanas: PestanaProyecto[] = [
    { href: `/proyectos/${proyecto.id}`, etiqueta: "Ficha" },
    { href: `/proyectos/${proyecto.id}/checklist`, etiqueta: "Checklist" },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo={proyecto.nombre}
        descripcion={`${proyecto.cliente.nombre}${proyecto.comuna ? ` · ${proyecto.comuna}` : ""}`}
        migas={[
          { etiqueta: "Proyectos", href: "/proyectos" },
          { etiqueta: proyecto.codigo },
        ]}
        acciones={
          puedeEditar && (
            <Boton variante="secundario" asChild>
              <Link href={`/proyectos/${proyecto.id}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar ficha
              </Link>
            </Boton>
          )
        }
      />

      <PestanasProyecto pestanas={pestanas} />

      {children}
    </>
  );
}
