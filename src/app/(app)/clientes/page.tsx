import Link from "next/link";
import { Plus } from "lucide-react";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { filtroClientes } from "@/server/datos/alcance";
import { ETIQUETAS_TIPO_CLIENTE } from "@/dominio/etiquetas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Boton } from "@/components/ui/boton";
import { EstadoVacio, Insignia, Tarjeta } from "@/components/ui/tarjeta";

export const metadata = { title: "Clientes" };

export default async function PaginaClientes() {
  const usuario = (await usuarioActual())!;

  const clientes = await prisma.cliente.findMany({
    where: filtroClientes(usuario),
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { proyectos: true } } },
  });

  const puedeCrear = puede(usuario, "cliente.crear");

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Mandantes, inmobiliarias y constructoras a las que prestas servicio."
        acciones={
          puedeCrear && (
            <Boton asChild>
              <Link href="/clientes/nuevo">
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Link>
            </Boton>
          )
        }
      />

      {clientes.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            titulo="Todavía no hay clientes"
            descripcion="Crea el primer cliente para poder registrar proyectos a su nombre."
          >
            {puedeCrear && (
              <Boton asChild>
                <Link href="/clientes/nuevo">Crear el primer cliente</Link>
              </Boton>
            )}
          </EstadoVacio>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clientes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="block rounded-xl border border-borde bg-superficie p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-texto">{cliente.nombre}</p>
                  {cliente.nombreFantasia && (
                    <p className="truncate text-sm text-texto-suave">{cliente.nombreFantasia}</p>
                  )}
                </div>
                {!cliente.activo && <Insignia tono="neutro">Inactivo</Insignia>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Insignia tono="marca">
                  {ETIQUETAS_TIPO_CLIENTE[cliente.tipo as keyof typeof ETIQUETAS_TIPO_CLIENTE]}
                </Insignia>
                <Insignia>
                  {cliente._count.proyectos}{" "}
                  {cliente._count.proyectos === 1 ? "proyecto" : "proyectos"}
                </Insignia>
              </div>

              {cliente.rut && <p className="mt-3 text-xs text-texto-suave">RUT {cliente.rut}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
