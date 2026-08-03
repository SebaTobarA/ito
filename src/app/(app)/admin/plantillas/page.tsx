import Link from "next/link";
import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { AccionesPlantilla } from "@/components/admin/acciones-plantilla";
import { GestorPlantilla } from "@/components/admin/gestor-plantilla";
import { EstadoVacio, Insignia, Tarjeta } from "@/components/ui/tarjeta";
import { cn } from "@/lib/utils";

export const metadata = { title: "Plantilla del checklist" };

export default async function PaginaPlantillas({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const usuario = (await usuarioActual())!;
  if (!puede(usuario, "plantilla.gestionar")) redirect("/panel");

  const { v } = await searchParams;

  const plantillas = await prisma.plantillaChecklist.findMany({
    orderBy: { version: "desc" },
    include: { _count: { select: { proyectos: true } } },
  });

  if (plantillas.length === 0) {
    return (
      <>
        <EncabezadoPagina titulo="Plantilla del checklist" />
        <Tarjeta>
          <EstadoVacio
            titulo="No hay plantillas cargadas"
            descripcion="Ejecuta la carga inicial con «npm run db:seed» para crear la plantilla base con las 20 categorías y sus 99 registros."
          />
        </Tarjeta>
      </>
    );
  }

  const seleccionada = plantillas.find((p) => p.id === v) ?? plantillas.find((p) => p.esActiva) ?? plantillas[0];

  const categorias = await prisma.categoriaPlantilla.findMany({
    where: { plantillaId: seleccionada.id },
    orderBy: { orden: "asc" },
    include: { items: { orderBy: { orden: "asc" } } },
  });

  const totalItems = categorias.reduce((suma, c) => suma + c.items.length, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Plantilla del checklist"
        descripcion="Tu metodología de control de calidad. Los proyectos nuevos se crean clonando la versión publicada."
        migas={[{ etiqueta: "Administración" }, { etiqueta: "Plantillas" }]}
        acciones={
          <AccionesPlantilla plantillaId={seleccionada.id} esActiva={seleccionada.esActiva} />
        }
      />

      {plantillas.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {plantillas.map((plantilla) => (
            <Link
              key={plantilla.id}
              href={`/admin/plantillas?v=${plantilla.id}`}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                plantilla.id === seleccionada.id
                  ? "border-[var(--marca-primario)] bg-[var(--marca-primario)] text-white"
                  : "border-borde bg-superficie text-texto hover:bg-fondo",
              )}
            >
              Versión {plantilla.version}
              {plantilla.esActiva && " · publicada"}
            </Link>
          ))}
        </div>
      )}

      <Tarjeta className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-texto">{seleccionada.nombre}</p>
          <Insignia tono={seleccionada.esActiva ? "exito" : "neutro"}>
            {seleccionada.esActiva ? "Publicada" : "Borrador"}
          </Insignia>
          <Insignia>Versión {seleccionada.version}</Insignia>
          <Insignia>
            {categorias.length} categorías · {totalItems} ítems
          </Insignia>
          <Insignia>
            {seleccionada._count.proyectos}{" "}
            {seleccionada._count.proyectos === 1 ? "proyecto creado" : "proyectos creados"}
          </Insignia>
        </div>
        {!seleccionada.esActiva && (
          <p className="mt-2 text-sm text-texto-suave">
            Esta versión es un borrador: edítala libremente y publícala cuando esté lista. Los
            proyectos existentes no se ven afectados.
          </p>
        )}
      </Tarjeta>

      <GestorPlantilla
        plantillaId={seleccionada.id}
        categorias={categorias}
        editable={puede(usuario, "plantilla.gestionar")}
      />
    </>
  );
}
