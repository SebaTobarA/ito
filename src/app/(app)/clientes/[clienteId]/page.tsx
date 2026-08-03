import Link from "next/link";
import { notFound } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { filtroClientes, filtroProyectos } from "@/server/datos/alcance";
import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import { ETIQUETAS_ESTADO_PROYECTO } from "@/dominio/etiquetas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioCliente } from "@/components/clientes/formulario-cliente";
import { PildoraCumplimiento } from "@/components/ui/cumplimiento";
import {
  CabeceraTarjeta,
  CuerpoTarjeta,
  EstadoVacio,
  Insignia,
  Tarjeta,
  TituloTarjeta,
} from "@/components/ui/tarjeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true },
  });
  return { title: cliente?.nombre ?? "Cliente" };
}

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const usuario = (await usuarioActual())!;
  const empresa = await obtenerConfiguracionSegura();

  const cliente = await prisma.cliente.findFirst({
    where: { AND: [{ id: clienteId }, filtroClientes(usuario)] },
  });
  if (!cliente) notFound();

  const proyectos = await prisma.proyecto.findMany({
    where: { AND: [{ clienteId }, filtroProyectos(usuario)] },
    orderBy: [{ estado: "asc" }, { nombre: "asc" }],
  });

  const puedeEditar = puede(usuario, "cliente.editar");

  return (
    <>
      <EncabezadoPagina
        titulo={cliente.nombre}
        descripcion={cliente.nombreFantasia ?? undefined}
        migas={[{ etiqueta: "Clientes", href: "/clientes" }, { etiqueta: cliente.nombre }]}
      />

      <Tarjeta className="mb-6">
        <CabeceraTarjeta>
          <TituloTarjeta>Proyectos del cliente</TituloTarjeta>
        </CabeceraTarjeta>
        {proyectos.length === 0 ? (
          <EstadoVacio titulo="Este cliente todavía no tiene proyectos registrados." />
        ) : (
          <ul className="divide-y divide-borde">
            {proyectos.map((proyecto) => (
              <li key={proyecto.id}>
                <Link
                  href={`/proyectos/${proyecto.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-fondo"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-texto">{proyecto.nombre}</p>
                    <p className="text-xs text-texto-suave">
                      {proyecto.codigo}
                      {proyecto.comuna ? ` · ${proyecto.comuna}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Insignia tono={proyecto.estado === "ACTIVO" ? "exito" : "neutro"}>
                      {ETIQUETAS_ESTADO_PROYECTO[proyecto.estado]}
                    </Insignia>
                    <PildoraCumplimiento
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

      {puedeEditar && (
        <>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-texto-suave uppercase">
            Editar ficha
          </h2>
          <FormularioCliente cliente={cliente} />
        </>
      )}

      {!puedeEditar && (
        <Tarjeta>
          <CabeceraTarjeta>
            <TituloTarjeta>Ficha del cliente</TituloTarjeta>
          </CabeceraTarjeta>
          <CuerpoTarjeta className="grid gap-3 text-sm sm:grid-cols-2">
            <Dato titulo="RUT" valor={cliente.rut} />
            <Dato titulo="Contacto" valor={cliente.contactoNombre} />
            <Dato titulo="Correo" valor={cliente.contactoEmail} />
            <Dato titulo="Teléfono" valor={cliente.contactoTelefono} />
            <Dato titulo="Dirección" valor={cliente.direccion} />
            <Dato titulo="Comuna" valor={cliente.comuna} />
          </CuerpoTarjeta>
        </Tarjeta>
      )}
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-xs text-texto-suave">{titulo}</p>
      <p className="text-texto">{valor || "—"}</p>
    </div>
  );
}
