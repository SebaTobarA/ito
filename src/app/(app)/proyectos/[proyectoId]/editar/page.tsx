import { notFound, redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { contextoProyecto, filtroClientes, filtroProyectos } from "@/server/datos/alcance";
import { opcionesEquipo, usuarioConRol } from "@/server/datos/usuarios";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioProyecto } from "@/components/proyectos/formulario-proyecto";

export const metadata = { title: "Editar proyecto" };

export default async function PaginaEditarProyecto({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const usuario = (await usuarioActual())!;

  const proyecto = await prisma.proyecto.findFirst({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
    include: { asignaciones: { where: { activo: true }, select: { usuarioId: true, rol: true } } },
  });
  if (!proyecto) notFound();

  const contexto = await contextoProyecto(usuario, proyectoId);
  if (!puede(usuario, "proyecto.editar", contexto ?? {})) redirect(`/proyectos/${proyectoId}`);

  const [clientes, usuarios] = await Promise.all([
    prisma.cliente.findMany({
      where: filtroClientes(usuario),
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    opcionesEquipo(),
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Editar proyecto"
        descripcion={proyecto.nombre}
        migas={[
          { etiqueta: "Proyectos", href: "/proyectos" },
          { etiqueta: proyecto.codigo, href: `/proyectos/${proyecto.id}` },
          { etiqueta: "Editar" },
        ]}
      />

      <FormularioProyecto
        proyecto={{
          id: proyecto.id,
          codigo: proyecto.codigo,
          nombre: proyecto.nombre,
          clienteId: proyecto.clienteId,
          constructoraNombre: proyecto.constructoraNombre,
          constructoraRut: proyecto.constructoraRut,
          centroCosto: proyecto.centroCosto,
          direccion: proyecto.direccion,
          comuna: proyecto.comuna,
          region: proyecto.region,
          tipoObra: proyecto.tipoObra,
          superficieM2: proyecto.superficieM2?.toString() ?? null,
          numeroUnidades: proyecto.numeroUnidades,
          montoContrato: proyecto.montoContrato?.toString() ?? null,
          moneda: proyecto.moneda,
          fechaInicio: aValorFecha(proyecto.fechaInicio),
          fechaTerminoEstimada: aValorFecha(proyecto.fechaTerminoEstimada),
          estado: proyecto.estado,
          notas: proyecto.notas,
          itoId: usuarioConRol(proyecto.asignaciones, "ITO"),
          jefeProyectoId: usuarioConRol(proyecto.asignaciones, "JEFE_PROYECTO"),
          subgerenteId: usuarioConRol(proyecto.asignaciones, "SUBGERENTE"),
        }}
        clientes={clientes.map((c) => ({ id: c.id, etiqueta: c.nombre }))}
        usuarios={usuarios}
        puedeAsignarEquipo={puede(usuario, "proyecto.asignarEquipo", contexto ?? {})}
      />
    </>
  );
}

/** Fecha en el formato que espera <input type="date">. */
function aValorFecha(valor: Date | null): string | null {
  return valor ? valor.toISOString().slice(0, 10) : null;
}
