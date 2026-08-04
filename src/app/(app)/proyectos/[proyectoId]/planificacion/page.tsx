import { notFound, redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { contextoProyecto } from "@/server/datos/alcance";
import { obtenerEquipoProyecto } from "@/server/datos/checklist";
import {
  obtenerItemsParaEnlazar,
  obtenerPlanificacion,
} from "@/server/datos/planificacion";
import { GuiaPlanificacion } from "@/components/planificacion/guia-planificacion";

export const metadata = { title: "Guía de planificación" };

export default async function PaginaPlanificacion({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const usuario = (await usuarioActual())!;

  const contexto = await contextoProyecto(usuario, proyectoId);
  if (!contexto) notFound();
  if (!puede(usuario, "planificacion.ver", contexto)) redirect(`/proyectos/${proyectoId}`);

  const [planificacion, equipoAsignable, itemsDelChecklist] = await Promise.all([
    obtenerPlanificacion(usuario, proyectoId),
    obtenerEquipoProyecto(usuario, proyectoId),
    obtenerItemsParaEnlazar(proyectoId),
  ]);
  if (!planificacion) notFound();

  return (
    <GuiaPlanificacion
      planificacion={planificacion}
      equipoAsignable={equipoAsignable}
      itemsDelChecklist={itemsDelChecklist}
      puedeEditar={puede(usuario, "planificacion.editar", contexto)}
    />
  );
}
