import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioCliente } from "@/components/clientes/formulario-cliente";

export const metadata = { title: "Nuevo cliente" };

export default async function PaginaNuevoCliente() {
  const usuario = (await usuarioActual())!;
  if (!puede(usuario, "cliente.crear")) redirect("/clientes");

  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo cliente"
        descripcion="Empresa mandante a la que se le asociarán uno o más proyectos."
        migas={[{ etiqueta: "Clientes", href: "/clientes" }, { etiqueta: "Nuevo" }]}
      />
      <FormularioCliente />
    </>
  );
}
