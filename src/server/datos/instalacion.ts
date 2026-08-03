import { prisma } from "@/lib/prisma";

/**
 * ¿La instalación ya está configurada?
 *
 * Una instalación recién desplegada no tiene ningún usuario: en ese estado la
 * aplicación muestra /configuracion-inicial para que el dueño cree su propia
 * cuenta de administrador. Así no hay que ejecutar comandos contra la base de
 * producción ni existe nunca una contraseña por defecto en un sitio público.
 */
export async function instalacionConfigurada(): Promise<boolean> {
  try {
    const usuarios = await prisma.usuario.count();
    return usuarios > 0;
  } catch {
    // Sin base de datos disponible no se puede saber; se asume configurada para
    // que el error real (de conexión) se muestre en su propio contexto.
    return true;
  }
}
