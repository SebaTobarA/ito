import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { contextoProyecto, filtroProyectos } from "@/server/datos/alcance";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import {
  ETIQUETAS_ESTADO_PROYECTO,
  ETIQUETAS_MONEDA,
  ETIQUETAS_ROL_PROYECTO,
} from "@/dominio/etiquetas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Boton } from "@/components/ui/boton";
import { BarraCumplimiento, PildoraCumplimiento } from "@/components/ui/cumplimiento";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  DescripcionTarjeta,
  Insignia,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { nombre: true },
  });
  return { title: proyecto?.nombre ?? "Proyecto" };
}

export default async function PaginaProyecto({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const usuario = (await usuarioActual())!;
  const empresa = await obtenerConfiguracionSegura();

  const proyecto = await prisma.proyecto.findFirst({
    where: { AND: [{ id: proyectoId }, filtroProyectos(usuario)] },
    include: {
      cliente: true,
      plantillaOrigen: { select: { nombre: true, version: true } },
      asignaciones: {
        where: { activo: true },
        include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
      },
      categorias: {
        orderBy: { orden: "asc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!proyecto) notFound();

  const contexto = await contextoProyecto(usuario, proyectoId);
  const puedeEditar = puede(usuario, "proyecto.editar", contexto ?? {});

  const totalItems = proyecto.categorias.reduce((suma, c) => suma + c._count.items, 0);

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

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <CabeceraTarjeta className="flex items-center justify-between gap-3">
            <div>
              <TituloTarjeta>Cumplimiento del proyecto</TituloTarjeta>
              <DescripcionTarjeta>
                {proyecto.itemsCumplen} de {proyecto.itemsAplicables} ítems aplicables cumplen ·{" "}
                {totalItems} registros en total
              </DescripcionTarjeta>
            </div>
            <PildoraCumplimiento
              porcentaje={
                proyecto.porcentajeCumplimiento === null
                  ? null
                  : Number(proyecto.porcentajeCumplimiento)
              }
              umbralBajo={empresa.umbralCumplimientoBajo}
              className="text-lg"
            />
          </CabeceraTarjeta>
          <CuerpoTarjeta>
            <div className="space-y-2.5">
              {proyecto.categorias.map((categoria) => (
                <div key={categoria.id} className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <span className="w-52 truncate text-sm text-texto sm:w-64">
                    <span className="mr-2 font-mono text-xs text-texto-suave">
                      {categoria.codigo}
                    </span>
                    {categoria.nombre}
                  </span>
                  <BarraCumplimiento
                    porcentaje={
                      categoria.porcentajeCumplimiento === null
                        ? null
                        : Number(categoria.porcentajeCumplimiento)
                    }
                    umbralBajo={empresa.umbralCumplimientoBajo}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-fondo px-3 py-2 text-xs text-texto-suave">
              La edición del checklist ítem por ítem, la carga de respaldos y los ciclos de revisión
              llegan en las fases 2 y 3.
            </p>
          </CuerpoTarjeta>
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta>
            <TituloTarjeta>Equipo a cargo</TituloTarjeta>
          </CabeceraTarjeta>
          <CuerpoTarjeta className="space-y-3">
            {proyecto.asignaciones.length === 0 && (
              <p className="text-sm text-texto-suave">Sin equipo asignado.</p>
            )}
            {proyecto.asignaciones.map((asignacion) => (
              <div key={asignacion.id}>
                <p className="text-xs text-texto-suave">
                  {ETIQUETAS_ROL_PROYECTO[asignacion.rol]}
                </p>
                <p className="text-sm font-medium text-texto">
                  {asignacion.usuario.nombre} {asignacion.usuario.apellido}
                </p>
              </div>
            ))}
          </CuerpoTarjeta>
        </Tarjeta>
      </div>

      <Tarjeta>
        <CabeceraTarjeta>
          <TituloTarjeta>Ficha del proyecto</TituloTarjeta>
        </CabeceraTarjeta>
        <CuerpoTarjeta className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Dato titulo="Código / centro de costo" valor={proyecto.codigo} />
          <Dato titulo="Cliente mandante" valor={proyecto.cliente.nombre} />
          <Dato titulo="Constructora ejecutora" valor={proyecto.constructoraNombre} />
          <Dato
            titulo="Estado"
            valor={<Insignia tono={proyecto.estado === "ACTIVO" ? "exito" : "neutro"}>
              {ETIQUETAS_ESTADO_PROYECTO[proyecto.estado]}
            </Insignia>}
          />
          <Dato titulo="Dirección" valor={proyecto.direccion} />
          <Dato titulo="Tipo de obra" valor={proyecto.tipoObra} />
          <Dato
            titulo="Superficie"
            valor={proyecto.superficieM2 ? `${Number(proyecto.superficieM2)} m²` : null}
          />
          <Dato titulo="N.º de unidades" valor={proyecto.numeroUnidades?.toString()} />
          <Dato
            titulo="Monto de contrato"
            valor={
              proyecto.montoContrato
                ? `${Number(proyecto.montoContrato).toLocaleString("es-CL")} ${ETIQUETAS_MONEDA[proyecto.moneda].match(/\(([^)]+)\)/)?.[1] ?? proyecto.moneda}`
                : null
            }
          />
          <Dato titulo="Inicio" valor={fecha(proyecto.fechaInicio)} />
          <Dato titulo="Término estimado" valor={fecha(proyecto.fechaTerminoEstimada)} />
          <Dato
            titulo="Plantilla de origen"
            valor={
              proyecto.plantillaOrigen
                ? `${proyecto.plantillaOrigen.nombre} · v${proyecto.plantillaOrigen.version}`
                : null
            }
          />
          {proyecto.notas && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-texto-suave">Notas</p>
              <p className="whitespace-pre-line text-texto">{proyecto.notas}</p>
            </div>
          )}
        </CuerpoTarjeta>
      </Tarjeta>
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-texto-suave">{titulo}</p>
      <div className="text-texto">{valor || "—"}</div>
    </div>
  );
}

function fecha(valor: Date | null): string | null {
  if (!valor) return null;
  return valor.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}
