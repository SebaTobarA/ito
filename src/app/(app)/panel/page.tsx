import Link from "next/link";
import { Building2, ClipboardList, Plus, TrendingUp } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { filtroClientes, filtroProyectos } from "@/server/datos/alcance";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { consolidarCumplimiento, formatearPorcentaje } from "@/dominio/cumplimiento";
import { ETIQUETAS_ESTADO_PROYECTO } from "@/dominio/etiquetas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Boton } from "@/components/ui/boton";
import { BarraCumplimiento } from "@/components/ui/cumplimiento";
import { EstadoVacio, Insignia, Tarjeta } from "@/components/ui/tarjeta";

export const metadata = { title: "Panel" };

export default async function PaginaPanel() {
  const usuario = (await usuarioActual())!;
  const empresa = await obtenerConfiguracionSegura();

  const [proyectos, totalClientes] = await Promise.all([
    prisma.proyecto.findMany({
      where: filtroProyectos(usuario),
      orderBy: [{ estado: "asc" }, { porcentajeCumplimiento: "asc" }],
      include: { cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.cliente.count({ where: { AND: [{ activo: true }, filtroClientes(usuario)] } }),
  ]);

  const activos = proyectos.filter((p) => p.estado === "ACTIVO" || p.estado === "EN_CIERRE");
  const consolidado = consolidarCumplimiento(
    activos.map((p) => ({ itemsAplicables: p.itemsAplicables, itemsCumplen: p.itemsCumplen })),
  );

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${usuario.nombreCompleto.split(" ")[0]}`}
        descripcion="Estado general de la cartera de proyectos."
        acciones={
          puede(usuario, "proyecto.crear") && (
            <Boton asChild>
              <Link href="/proyectos/nuevo">
                <Plus className="h-4 w-4" />
                Nuevo proyecto
              </Link>
            </Boton>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador
          icono={<ClipboardList className="h-5 w-5" />}
          titulo="Proyectos en curso"
          valor={activos.length.toString()}
          detalle={`${proyectos.length} en total`}
        />
        <Indicador
          icono={<Building2 className="h-5 w-5" />}
          titulo="Clientes activos"
          valor={totalClientes.toString()}
        />
        <Indicador
          icono={<TrendingUp className="h-5 w-5" />}
          titulo="Cumplimiento consolidado"
          valor={formatearPorcentaje(consolidado.porcentaje)}
          detalle={`${consolidado.itemsCumplen}/${consolidado.itemsAplicables} ítems`}
        />
      </div>

      <Tarjeta>
        <div className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="text-base font-semibold">Proyectos</h2>
          <Link
            href="/proyectos"
            className="text-sm text-[var(--marca-secundario)] hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {proyectos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay proyectos"
            descripcion="Crea un cliente y luego su primer proyecto para empezar a controlar la obra."
          >
            {puede(usuario, "cliente.crear") && (
              <Boton asChild>
                <Link href="/clientes/nuevo">Crear cliente</Link>
              </Boton>
            )}
          </EstadoVacio>
        ) : (
          <ul className="divide-y divide-borde">
            {proyectos.slice(0, 10).map((proyecto) => (
              <li key={proyecto.id}>
                <Link
                  href={`/proyectos/${proyecto.id}`}
                  className="flex flex-col gap-3 px-5 py-3.5 hover:bg-fondo sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-texto">{proyecto.nombre}</p>
                      <Insignia tono={proyecto.estado === "ACTIVO" ? "exito" : "neutro"}>
                        {ETIQUETAS_ESTADO_PROYECTO[proyecto.estado]}
                      </Insignia>
                    </div>
                    <p className="truncate text-sm text-texto-suave">{proyecto.cliente.nombre}</p>
                  </div>
                  <div className="w-full sm:w-56">
                    <BarraCumplimiento
                      porcentaje={
                        proyecto.porcentajeCumplimiento === null
                          ? null
                          : Number(proyecto.porcentajeCumplimiento)
                      }
                      umbralBajo={empresa.umbralCumplimientoBajo}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}

function Indicador({
  icono,
  titulo,
  valor,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <Tarjeta className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-texto-suave">{titulo}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-texto">{valor}</p>
          {detalle && <p className="mt-0.5 text-xs text-texto-suave">{detalle}</p>}
        </div>
        <span className="rounded-lg bg-[var(--marca-primario)]/10 p-2 text-[var(--marca-primario)]">
          {icono}
        </span>
      </div>
    </Tarjeta>
  );
}
