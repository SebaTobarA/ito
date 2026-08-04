import { usuarioActual } from "@/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { almacenamiento } from "@/lib/almacenamiento";
import { contextoProyecto } from "@/server/datos/alcance";
import { filtroProyectos } from "@/server/datos/alcance";

/**
 * Entrega de un respaldo documental.
 *
 * Los archivos nunca se sirven directamente desde el almacenamiento: la clave
 * interna no se expone al navegador y cada descarga verifica que el usuario
 * alcance el proyecto dueño del documento. Es la condición para que el portal de
 * cliente futuro no permita adivinar la URL del documento de otro proyecto.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ documentoId: string }> },
) {
  const { documentoId } = await params;
  const usuario = await usuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });

  const documento = await prisma.documento.findFirst({
    where: {
      id: documentoId,
      eliminadoAt: null,
      proyecto: filtroProyectos(usuario),
    },
    select: {
      claveAlmacenamiento: true,
      nombre: true,
      mimeType: true,
      proyectoId: true,
      visibleParaCliente: true,
    },
  });
  // Mismo 404 si no existe o si el usuario no lo alcanza: no se filtra
  // la existencia de documentos de otros proyectos.
  if (!documento) return new Response("No encontrado", { status: 404 });

  const contexto = await contextoProyecto(usuario, documento.proyectoId);
  if (!puede(usuario, "documento.ver", contexto ?? {})) {
    return new Response("No autorizado", { status: 403 });
  }

  // PORTAL DE CLIENTE: los respaldos internos no salen hacia el mandante.
  if (usuario.rolGlobal === "CLIENTE" && !documento.visibleParaCliente) {
    return new Response("No encontrado", { status: 404 });
  }

  try {
    const contenido = await almacenamiento().leer(documento.claveAlmacenamiento);
    const cuerpo = contenido instanceof Buffer ? new Uint8Array(contenido) : contenido;

    return new Response(cuerpo as BodyInit, {
      headers: {
        "Content-Type": documento.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(documento.nombre)}`,
        // Privado: un respaldo no debe quedar cacheado en proxies compartidos.
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[archivos] no se pudo leer el respaldo", error);
    return new Response("El archivo no está disponible", { status: 502 });
  }
}
