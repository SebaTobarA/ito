import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { obtenerConfiguracionSegura } from "@/server/datos/empresa";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const empresa = await obtenerConfiguracionSegura();
  return {
    title: {
      default: `${empresa.nombreEmpresa} — Gerenciamiento de Proyectos`,
      template: `%s · ${empresa.nombreEmpresa}`,
    },
    description:
      "Sistema de Inspección Técnica de Obras y Gerenciamiento de Proyectos Inmobiliarios.",
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const empresa = await obtenerConfiguracionSegura();

  // La marca se inyecta como variables CSS: cambiar los colores en
  // Administración → Empresa se refleja en toda la aplicación sin recompilar.
  const variablesDeMarca = `:root{--marca-primario:${empresa.colorPrimario};--marca-secundario:${empresa.colorSecundario};--marca-acento:${empresa.colorAcento};}`;

  return (
    <html lang="es-CL">
      <head>
        <style dangerouslySetInnerHTML={{ __html: variablesDeMarca }} />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
