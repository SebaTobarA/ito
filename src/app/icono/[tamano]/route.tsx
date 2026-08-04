import { ImageResponse } from "next/og";

import { obtenerConfiguracionSegura } from "@/server/datos/empresa";

export const dynamic = "force-dynamic";

const TAMANOS_PERMITIDOS = [192, 512];

/**
 * Ícono de la PWA generado a partir de la marca configurada.
 *
 * Se genera en vez de guardarse como archivo porque la marca todavía no está
 * definida y va a cambiar: un PNG en `public/` obligaría a reemplazar binarios a
 * mano cada vez que se ajusten la sigla o los colores.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ tamano: string }> },
) {
  const { tamano } = await params;
  const lado = Number(tamano);
  if (!TAMANOS_PERMITIDOS.includes(lado)) {
    return new Response("Tamaño no soportado", { status: 404 });
  }

  const empresa = await obtenerConfiguracionSegura();
  // La sigla puede traer corchetes del placeholder por defecto («[TE]»).
  const sigla = empresa.nombreCorto.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3) || "ITO";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario} 100%)`,
          color: "white",
          fontSize: lado * (sigla.length > 2 ? 0.3 : 0.42),
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        {sigla}
      </div>
    ),
    { width: lado, height: lado },
  );
}
