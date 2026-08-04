"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import {
  aObjeto,
  esquemaAccionMasiva,
  esquemaEdicionItem,
  esquemaItemAdHoc,
} from "@/lib/validaciones";
import { calcularProximoControl, hoyEnChile, type Frecuencia } from "@/dominio/frecuencias";
import { generarCodigoRegistro, siguienteCodigoItem } from "@/dominio/codificacion";
import { contextoProyecto } from "@/server/datos/alcance";
import {
  obtenerCategoriaEnAlcance,
  obtenerItemEnAlcance,
} from "@/server/datos/checklist";
import { obtenerConfiguracionEmpresa } from "@/server/datos/empresa";
import { camposModificados, registrarAuditoria } from "@/server/servicios/auditoria";
import { recalcularCumplimientoProyecto } from "@/server/servicios/recalcular-cumplimiento";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

/**
 * Mutaciones del checklist de un proyecto.
 *
 * Todas siguen el mismo orden: validación Zod → verificación de permiso →
 * transacción que incluye el recálculo de cumplimiento → auditoría →
 * `revalidatePath`. El recálculo va dentro de la transacción a propósito: si
 * quedara fuera, un fallo dejaría el porcentaje mostrado mintiendo sobre los datos.
 */

function rutasDelProyecto(proyectoId: string): string[] {
  return [`/proyectos/${proyectoId}/checklist`, `/proyectos/${proyectoId}`, "/panel"];
}

function revalidarProyecto(proyectoId: string) {
  for (const ruta of rutasDelProyecto(proyectoId)) revalidatePath(ruta);
}

/** Edición de un ítem, campo a campo. La vista guarda apenas cambia un control. */
export async function actualizarItem(
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
    exigir(usuario, "item.editar", contexto ?? {});

    // Solo llegan los campos que el formulario envió: quien cambia el estado de
    // cumplimiento no reenvía la frecuencia ni las observaciones.
    const enviados = aObjeto(datos, ["aplica"]);
    const valores = esquemaEdicionItem.parse(enviados);

    const cambios: Record<string, unknown> = { ...valores };

    /*
     * Marcar un ítem como cumplido significa que el registro se produjo hoy, así
     * que reinicia el reloj de su frecuencia. Sin esto, un ítem semanal quedaría
     * sin próxima fecha de control y nunca aparecería como atrasado.
     *
     * Se respeta la fecha que el usuario haya escrito a mano (puede estar
     * registrando algo de la semana pasada); solo se completa si viene vacía.
     */
    if (valores.cumple === "SI" && valores.fechaUltimoControl === undefined) {
      cambios.fechaUltimoControl = hoyEnChile();
    }

    const frecuencia = (valores.frecuencia ?? item.frecuencia) as Frecuencia;
    const fechaUltimoControl =
      (cambios.fechaUltimoControl as Date | null | undefined) ?? item.fechaUltimoControl;

    cambios.fechaProximoControl = calcularProximoControl({
      frecuencia,
      fechaUltimoControl,
      fechaInicioProyecto: proyecto.fechaInicio,
      fechaTerminoProyecto: proyecto.fechaTerminoEstimada,
    });

    await prisma.$transaction(async (tx) => {
      await tx.itemProyecto.update({ where: { id: itemProyectoId }, data: cambios });
      await recalcularCumplimientoProyecto(proyecto.id, tx);
    });

    const modificados = camposModificados(
      item as unknown as Record<string, unknown>,
      cambios as Record<string, unknown>,
    );
    if (Object.keys(modificados.nuevo).length > 0) {
      await registrarAuditoria({
        entidad: "ItemProyecto",
        entidadId: itemProyectoId,
        accion: "ACTUALIZAR",
        usuarioId: usuario.id,
        proyectoId: proyecto.id,
        valorAnterior: modificados.anterior,
        valorNuevo: modificados.nuevo,
      });
    }

    revalidarProyecto(proyecto.id);
    return { ok: true };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/**
 * Acción aplicada a todos los ítems de una categoría.
 *
 * `marcarNoAplica` desactiva la categoría y sus ítems: es lo que se espera al
 * decir «esta categoría completa no aplica a esta obra». Es reversible con
 * `marcarAplica`.
 */
export async function accionMasivaCategoria(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    const valores = esquemaAccionMasiva.parse(aObjeto(datos));

    const enAlcance = await obtenerCategoriaEnAlcance(usuario, valores.categoriaProyectoId);
    if (!enAlcance) return { error: "La categoría no existe o no tienes acceso a su proyecto." };
    const { categoria, proyecto } = enAlcance;

    const contexto = await contextoProyecto(usuario, proyecto.id);
    exigir(usuario, "item.editar", contexto ?? {});

    let afectados = 0;
    let mensaje = "";

    await prisma.$transaction(async (tx) => {
      if (valores.operacion === "asignarResponsable") {
        const resultado = await tx.itemProyecto.updateMany({
          where: { categoriaProyectoId: categoria.id },
          data: { responsableUsuarioId: valores.responsableUsuarioId ?? null },
        });
        afectados = resultado.count;
        mensaje = valores.responsableUsuarioId
          ? `Responsable asignado a ${afectados} ítems.`
          : `Responsable retirado de ${afectados} ítems.`;
      } else {
        const aplica = valores.operacion === "marcarAplica";
        await tx.categoriaProyecto.update({ where: { id: categoria.id }, data: { aplica } });
        const resultado = await tx.itemProyecto.updateMany({
          where: { categoriaProyectoId: categoria.id },
          data: { aplica },
        });
        afectados = resultado.count;
        mensaje = aplica
          ? `Categoría "${categoria.nombre}" reactivada con sus ${afectados} ítems.`
          : `Categoría "${categoria.nombre}" marcada como no aplica (${afectados} ítems).`;
      }

      await recalcularCumplimientoProyecto(proyecto.id, tx);
    });

    await registrarAuditoria({
      entidad: "CategoriaProyecto",
      entidadId: categoria.id,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      proyectoId: proyecto.id,
      campo: valores.operacion,
      valorNuevo: { operacion: valores.operacion, itemsAfectados: afectados },
    });

    revalidarProyecto(proyecto.id);
    return { ok: true, mensaje };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/**
 * Ítem propio de este proyecto, fuera de la plantilla maestra.
 *
 * Queda con `itemPlantillaId = null`, que es lo que lo distingue de los clonados
 * y lo que permite mostrarlo marcado como agregado a medida.
 */
export async function crearItemAdHoc(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    const valores = esquemaItemAdHoc.parse(aObjeto(datos, ["visibleParaCliente"]));

    const enAlcance = await obtenerCategoriaEnAlcance(usuario, valores.categoriaProyectoId);
    if (!enAlcance) return { error: "La categoría no existe o no tienes acceso a su proyecto." };
    const { categoria, proyecto } = enAlcance;

    const contexto = await contextoProyecto(usuario, proyecto.id);
    exigir(usuario, "item.crear", contexto ?? {});

    const hermanos = await prisma.itemProyecto.findMany({
      where: { categoriaProyectoId: categoria.id },
      select: { codigo: true, orden: true },
    });

    const codigo = siguienteCodigoItem(
      categoria.codigo,
      hermanos.map((h) => h.codigo),
    );
    const orden = hermanos.reduce((mayor, h) => Math.max(mayor, h.orden), 0) + 1;

    const empresa = await obtenerConfiguracionEmpresa();
    const codigoRegistro =
      valores.codigoRegistro ??
      generarCodigoRegistro(empresa.formatoCodigoRegistro, {
        prefijo: empresa.prefijoDocumentos,
        codigoCategoria: categoria.codigo,
        codigoItem: codigo,
      });

    const creado = await prisma.$transaction(async (tx) => {
      const item = await tx.itemProyecto.create({
        data: {
          categoriaProyectoId: categoria.id,
          itemPlantillaId: null,
          codigo,
          orden,
          descripcion: valores.descripcion,
          codigoRegistro,
          subgrupo: valores.subgrupo,
          instrucciones: valores.instrucciones,
          frecuencia: valores.frecuencia,
          responsableRol: valores.responsableRol,
          revisorRol: valores.revisorRol,
          requiereRespaldoDigital: valores.requiereRespaldoDigital,
          requiereRespaldoFisico: valores.requiereRespaldoFisico,
          visibleParaCliente: valores.visibleParaCliente,
          fechaProximoControl: calcularProximoControl({
            frecuencia: valores.frecuencia as Frecuencia,
            fechaInicioProyecto: proyecto.fechaInicio,
            fechaTerminoProyecto: proyecto.fechaTerminoEstimada,
          }),
        },
      });

      await recalcularCumplimientoProyecto(proyecto.id, tx);
      return item;
    });

    await registrarAuditoria({
      entidad: "ItemProyecto",
      entidadId: creado.id,
      accion: "CREAR",
      usuarioId: usuario.id,
      proyectoId: proyecto.id,
      valorNuevo: { codigo: creado.codigo, descripcion: creado.descripcion, adHoc: true },
    });

    revalidarProyecto(proyecto.id);
    return { ok: true, mensaje: `Ítem ${creado.codigo} agregado a "${categoria.nombre}".` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
