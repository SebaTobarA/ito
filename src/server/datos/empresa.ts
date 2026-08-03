import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const ID_CONFIGURACION = "singleton";

/**
 * Configuración de marca de la empresa. Fila única; si no existe se crea con los
 * valores por defecto (placeholder "[Tu Empresa]") para que la aplicación funcione
 * desde el primer arranque.
 *
 * `cache` de React deduplica la consulta dentro de un mismo render.
 */
export const obtenerConfiguracionEmpresa = cache(async () => {
  const existente = await prisma.configuracionEmpresa.findUnique({
    where: { id: ID_CONFIGURACION },
  });
  if (existente) return existente;

  return prisma.configuracionEmpresa.create({ data: { id: ID_CONFIGURACION } });
});

export type ConfiguracionEmpresa = Awaited<ReturnType<typeof obtenerConfiguracionEmpresa>>;

/** Valores usados cuando todavía no hay base de datos disponible. */
export const CONFIGURACION_POR_DEFECTO = {
  nombreEmpresa: "[Tu Empresa]",
  nombreCorto: "[TE]",
  logoUrl: null as string | null,
  colorPrimario: "#1E3A5F",
  colorSecundario: "#2D6A9F",
  colorAcento: "#E08B2C",
  umbralCumplimientoBajo: 70,
  diasAlertaVencimientoDefecto: 30,
  prefijoDocumentos: "TE",
};

/**
 * Variante tolerante a fallos para el layout raíz y otras vistas que deben poder
 * renderizarse aunque la base de datos no esté disponible (por ejemplo, durante
 * el build o antes de correr las migraciones).
 */
export const obtenerConfiguracionSegura = cache(async () => {
  try {
    return await obtenerConfiguracionEmpresa();
  } catch {
    return CONFIGURACION_POR_DEFECTO as unknown as ConfiguracionEmpresa;
  }
});
