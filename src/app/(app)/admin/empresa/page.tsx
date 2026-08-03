import { redirect } from "next/navigation";

import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { obtenerConfiguracionEmpresa } from "@/server/datos/empresa";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioEmpresa } from "@/components/admin/formulario-empresa";

export const metadata = { title: "Configuración de la empresa" };

export default async function PaginaEmpresa() {
  const usuario = (await usuarioActual())!;
  if (!puede(usuario, "empresa.configurar")) redirect("/panel");

  const empresa = await obtenerConfiguracionEmpresa();

  return (
    <>
      <EncabezadoPagina
        titulo="Configuración de la empresa"
        descripcion="Marca, colores y esquema de codificación. Todo lo que hace que la aplicación se vea como tuya."
        migas={[{ etiqueta: "Administración" }, { etiqueta: "Empresa" }]}
      />
      <FormularioEmpresa empresa={empresa} />
    </>
  );
}
