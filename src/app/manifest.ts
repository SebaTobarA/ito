import type { MetadataRoute } from "next";

import { obtenerConfiguracionSegura } from "@/server/datos/empresa";

// Lee la configuración de la empresa, así que no se puede generar en compilación.
export const dynamic = "force-dynamic";

/**
 * Manifiesto de la PWA, derivado de la marca configurada.
 *
 * Es dinámico a propósito: si fuera un archivo estático, al cambiar el nombre o
 * los colores en Administración → Empresa la aplicación instalada en el celular
 * seguiría mostrando la marca antigua.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const empresa = await obtenerConfiguracionSegura();

  return {
    name: `${empresa.nombreEmpresa} — Gerenciamiento de Proyectos`,
    short_name: empresa.nombreCorto,
    description:
      "Inspección Técnica de Obras y Gerenciamiento de Proyectos Inmobiliarios.",
    start_url: "/panel",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: empresa.colorPrimario,
    lang: "es-CL",
    orientation: "portrait-primary",
    icons: [
      { src: "/icono/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
