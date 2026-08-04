"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import {
  almacenamiento,
  formatearTamano,
  rutaDeRespaldo,
  TAMANO_MAXIMO_BYTES,
  tipoEsPermitido,
} from "@/lib/almacenamiento";
import { sucesorAlEliminar, versionParaNuevoDocumento } from "@/dominio/documentos";
import { contextoProyecto } from "@/server/datos/alcance";
import { obtenerDocumentosDeItem, obtenerItemEnAlcance } from "@/server/datos/checklist";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

/**
 * Respaldos documentales de un ítem del checklist.
 *
 * Los archivos nunca son públicos: se guardan tras el adaptador de
 * almacenamiento con una clave interna que no se expone, y se sirven por
 * `/api/archivos/[documentoId]`, que verifica permisos antes de entregar nada.
 */

export interface DocumentoListado {
  id: string;
  nombre: string;
  mimeType: string;
  tamanoBytes: number;
  version: number;
  esVersionActual: boolean;
  descripcion: string | null;
  subidoAt: string;
  subidoPor: string;
}

/**
 * Respaldos vigentes e históricos de un ítem.
 *
 * Se consulta cuando el ítem se despliega, no junto con el checklist completo:
 * cargar los documentos de 99 ítems para mostrar tres sería desperdiciar la
 * consulta entera.
 */
export async function listarDocumentos(itemProyectoId: string): Promise<DocumentoListado[]> {
  const usuario = await exigirSesion();
  const documentos = await obtenerDocumentosDeItem(usuario, itemProyectoId);
  if (!documentos) return [];

  return documentos.map((documento) => ({
    id: documento.id,
    nombre: documento.nombre,
    mimeType: documento.mimeType,
    tamanoBytes: documento.tamanoBytes,
    version: documento.version,
    esVersionActual: documento.esVersionActual,
    descripcion: documento.descripcion,
    subidoAt: documento.subidoAt.toISOString(),
    subidoPor: `${documento.subidoPor.nombre} ${documento.subidoPor.apellido}`,
  }));
}

/**
 * Sube un respaldo.
 *
 * Si viene `reemplazaAId`, el archivo entra como versión siguiente de ese
 * documento y la anterior deja de ser la vigente — pero no se borra: el
 * historial de versiones es parte de la trazabilidad del proyecto.
 */
export async function subirDocumento(
  itemProyectoId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();

    const enAlcance = await obtenerItemEnAlcance(usuario, itemProyectoId);
    if (!enAlcance) return { error: "El ítem no existe o no tienes acceso a su proyecto." };
    const { item, proyecto } = enAlcance;

    const contexto = await contextoProyecto(usuario, proyecto.id);
    exigir(usuario, "documento.subir", contexto ?? {});

    const archivo = datos.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0) {
      return { error: "Selecciona un archivo para subir." };
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      return {
        error: `El archivo pesa ${formatearTamano(archivo.size)}. El máximo es ${formatearTamano(TAMANO_MAXIMO_BYTES)}.`,
      };
    }
    if (!tipoEsPermitido(archivo.type)) {
      return { error: `Tipo de archivo no permitido (${archivo.type || "desconocido"}).` };
    }

    const descripcion = (datos.get("descripcion") as string | null)?.trim() || null;
    const reemplazaAId = (datos.get("reemplazaAId") as string | null) || null;

    let anterior: { version: number } | null = null;
    if (reemplazaAId) {
      anterior = await prisma.documento.findFirst({
        where: { id: reemplazaAId, itemProyectoId, eliminadoAt: null },
        select: { version: true },
      });
      if (!anterior) return { error: "La versión que intentas reemplazar ya no existe." };
    }
    const version = versionParaNuevoDocumento(anterior);

    const ruta = rutaDeRespaldo({
      proyectoId: proyecto.id,
      itemProyectoId,
      nombreArchivo: archivo.name,
    });
    const guardado = await almacenamiento().guardar(archivo, ruta);

    const documento = await prisma.$transaction(async (tx) => {
      if (reemplazaAId) {
        await tx.documento.update({
          where: { id: reemplazaAId },
          data: { esVersionActual: false },
        });
      }

      const creado = await tx.documento.create({
        data: {
          itemProyectoId,
          proyectoId: proyecto.id,
          nombre: archivo.name,
          nombreOriginal: archivo.name,
          claveAlmacenamiento: guardado.clave,
          mimeType: archivo.type,
          tamanoBytes: guardado.bytes,
          version,
          esVersionActual: true,
          reemplazaAId,
          descripcion,
          subidoPorId: usuario.id,
        },
      });

      /*
       * Tener el respaldo cargado ES el respaldo digital. Marcarlo a mano
       * después sería pedirle al ITO que registre dos veces lo mismo.
       */
      if (item.requiereRespaldoDigital !== "NO_APLICA" && item.respaldoDigital !== "SI") {
        await tx.itemProyecto.update({
          where: { id: itemProyectoId },
          data: { respaldoDigital: "SI" },
        });
      }

      return creado;
    });

    await registrarAuditoria({
      entidad: "Documento",
      entidadId: documento.id,
      accion: "SUBIR_ARCHIVO",
      usuarioId: usuario.id,
      proyectoId: proyecto.id,
      valorNuevo: { nombre: documento.nombre, version: documento.version, itemProyectoId },
    });

    revalidatePath(`/proyectos/${proyecto.id}/checklist`);
    return {
      ok: true,
      mensaje:
        version > 1
          ? `Versión ${version} de "${documento.nombre}" cargada.`
          : `Respaldo "${documento.nombre}" cargado.`,
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/**
 * Borrado lógico de un respaldo.
 *
 * El archivo no se elimina del almacenamiento ni la fila de la base: se marca
 * con `eliminadoAt`. Regla 5 del proyecto — un respaldo documental no se pierde
 * nunca, porque es la prueba de que el control se hizo.
 */
export async function eliminarDocumento(
  documentoId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();

    const documento = await prisma.documento.findFirst({
      where: { id: documentoId, eliminadoAt: null },
      select: {
        id: true,
        nombre: true,
        proyectoId: true,
        itemProyectoId: true,
        esVersionActual: true,
        reemplazaAId: true,
      },
    });
    if (!documento) return { error: "El respaldo no existe o ya fue eliminado." };

    const contexto = await contextoProyecto(usuario, documento.proyectoId);
    if (!contexto) return { error: "No tienes acceso a este proyecto." };
    exigir(usuario, "documento.eliminar", contexto);

    // La cadena completa del ítem: `sucesorAlEliminar` la recorre hacia atrás
    // hasta dar con una versión viva, no solo la inmediatamente anterior.
    const cadena = await prisma.documento.findMany({
      // `proyectoId` acota la búsqueda: `itemProyectoId` es nullable, y sin este
      // límite un documento suelto traería los de otros proyectos.
      where: { proyectoId: documento.proyectoId, itemProyectoId: documento.itemProyectoId },
      select: {
        id: true,
        version: true,
        esVersionActual: true,
        reemplazaAId: true,
        eliminadoAt: true,
      },
    });
    const sucesorId = documento.esVersionActual ? sucesorAlEliminar(documentoId, cadena) : null;

    await prisma.$transaction(async (tx) => {
      await tx.documento.update({
        where: { id: documentoId },
        data: { eliminadoAt: new Date(), eliminadoPorId: usuario.id, esVersionActual: false },
      });

      // Si se elimina la versión vigente, la anterior viva vuelve a serlo: el
      // ítem no debe quedar sin respaldo actual teniendo uno válido.
      if (sucesorId) {
        await tx.documento.update({ where: { id: sucesorId }, data: { esVersionActual: true } });
      }
    });

    await registrarAuditoria({
      entidad: "Documento",
      entidadId: documentoId,
      accion: "ELIMINAR_ARCHIVO",
      usuarioId: usuario.id,
      proyectoId: documento.proyectoId,
      valorAnterior: { nombre: documento.nombre },
    });

    revalidatePath(`/proyectos/${documento.proyectoId}/checklist`);
    return { ok: true, mensaje: `Respaldo "${documento.nombre}" eliminado.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
