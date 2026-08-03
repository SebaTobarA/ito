import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { ListaUsuarios } from "@/components/admin/lista-usuarios";

export const metadata = { title: "Usuarios" };

export default async function PaginaUsuarios() {
  const sesion = (await usuarioActual())!;
  if (!puede(sesion, "usuario.gestionar")) redirect("/panel");

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      cargo: true,
      telefono: true,
      rolGlobal: true,
      activo: true,
    },
  });

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Equipo interno con acceso al sistema. El acceso de clientes externos llega en una fase posterior."
        migas={[{ etiqueta: "Administración" }, { etiqueta: "Usuarios" }]}
      />
      <ListaUsuarios usuarios={usuarios} />
    </>
  );
}
