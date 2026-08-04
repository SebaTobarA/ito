import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { filtroProyectos } from "@/server/datos/alcance";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { ETIQUETAS_ESTADO_PROYECTO, ETIQUETAS_ROL_PROYECTO } from "@/dominio/etiquetas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Boton } from "@/components/ui/boton";
import { BarraCumplimiento } from "@/components/ui/cumplimiento";
import { EstadoVacio, Insignia, Tarjeta } from "@/components/ui/tarjeta";

export const metadata = { title: "Proyectos" };

export default async function PaginaProyectos() {
  const usuario = (await usuarioActual())!;
  const empresa = await obtenerConfiguracionSegura();

  const proyectos = await prisma.proyecto.findMany({
    where: filtroProyectos(usuario),
    orderBy: [{ estado: "asc" }, { nombre: "asc" }],
    include: {
      cliente: { select: { nombre: true } },
      asignaciones: {
        where: { activo: true },
        select: { rol: true, usuario: { select: { nombre: true, apellido: true } } },
      },
    },
  });

  const puedeCrear = puede(usuario, "proyecto.crear");

  return (
    <>
      <EncabezadoPagina
        titulo="Proyectos"
        descripcion="Obras bajo inspección técnica y gerenciamiento."
        acciones={
          puedeCrear && (
            <Boton asChild>
              <Link href="/proyectos/nuevo">
                <Plus className="h-4 w-4" />
                Nuevo proyecto
              </Link>
            </Boton>
          )
        }
      />

      {proyectos.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            titulo="No tienes proyectos asignados"
            descripcion={
              puedeCrear
                ? "Crea el primer proyecto: se generará automáticamente su checklist de calidad."
                : "Cuando te asignen a un proyecto, aparecerá aquí."
            }
          >
            {puedeCrear && (
              <Boton asChild>
                <Link href="/proyectos/nuevo">Crear el primer proyecto</Link>
              </Boton>
            )}
          </EstadoVacio>
        </Tarjeta>
      ) : (
        <div className="space-y-3">
          {proyectos.map((proyecto) => {
            const ito = proyecto.asignaciones.find((a) => a.rol === "ITO");
            const jefe = proyecto.asignaciones.find((a) => a.rol === "JEFE_PROYECTO");

            return (
              <div
                key={proyecto.id}
                className="rounded-xl border border-borde bg-superficie p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-fondo px-1.5 py-0.5 font-mono text-xs text-texto-suave">
                        {proyecto.codigo}
                      </span>
                      <Insignia tono={proyecto.estado === "ACTIVO" ? "exito" : "neutro"}>
                        {ETIQUETAS_ESTADO_PROYECTO[proyecto.estado]}
                      </Insignia>
                    </div>
                    {/* El título es el enlace, no la tarjeta entera: así el acceso
                        directo al checklist puede ser otro enlace sin anidarlos. */}
                    <Link
                      href={`/proyectos/${proyecto.id}`}
                      className="mt-1.5 block truncate font-semibold text-texto hover:underline"
                    >
                      {proyecto.nombre}
                    </Link>
                    <p className="truncate text-sm text-texto-suave">
                      {proyecto.cliente.nombre}
                      {proyecto.comuna ? ` · ${proyecto.comuna}` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
                      {ito && (
                        <span>
                          {ETIQUETAS_ROL_PROYECTO.ITO}: {ito.usuario.nombre} {ito.usuario.apellido}
                        </span>
                      )}
                      {jefe && (
                        <span>
                          {ETIQUETAS_ROL_PROYECTO.JEFE_PROYECTO}: {jefe.usuario.nombre}{" "}
                          {jefe.usuario.apellido}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full shrink-0 lg:w-64">
                    <p className="mb-1 text-xs text-texto-suave">
                      Cumplimiento · {proyecto.itemsCumplen}/{proyecto.itemsAplicables} ítems
                    </p>
                    <BarraCumplimiento
                      porcentaje={
                        proyecto.porcentajeCumplimiento === null
                          ? null
                          : Number(proyecto.porcentajeCumplimiento)
                      }
                      umbralBajo={empresa.umbralCumplimientoBajo}
                    />
                    <div className="mt-2 flex gap-2">
                      <Boton variante="secundario" tamano="sm" className="flex-1" asChild>
                        <Link href={`/proyectos/${proyecto.id}`}>Ficha</Link>
                      </Boton>
                      <Boton variante="secundario" tamano="sm" className="flex-1" asChild>
                        <Link href={`/proyectos/${proyecto.id}/checklist`}>
                          <ListChecks className="h-3.5 w-3.5" />
                          Checklist
                        </Link>
                      </Boton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
