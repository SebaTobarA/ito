"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir, type RolProyecto } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaProyecto } from "@/lib/validaciones";
import { contextoProyecto } from "@/server/datos/alcance";
import { obtenerConfiguracionEmpresa } from "@/server/datos/empresa";
import { camposModificados, registrarAuditoria } from "@/server/servicios/auditoria";
import {
  clonarPlantillaEnProyecto,
  ErrorSinPlantillaActiva,
  obtenerPlantillaActiva,
} from "@/server/servicios/clonar-plantilla";
import { clonarPlanificacionEnProyecto } from "@/server/servicios/clonar-planificacion";
import { recalcularCumplimientoProyecto } from "@/server/servicios/recalcular-cumplimiento";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

export interface ResultadoProyecto extends ResultadoAccion {
  proyectoId?: string;
}

/**
 * Crea un proyecto y clona en él la plantilla maestra activa.
 *
 * Todo ocurre en una sola transacción: si algo falla, no queda un proyecto a
 * medio construir sin checklist.
 */
export async function crearProyecto(
  _previo: ResultadoProyecto,
  datos: FormData,
): Promise<ResultadoProyecto> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "proyecto.crear");

    const valores = esquemaProyecto.parse(aObjeto(datos));
    const { itoId, jefeProyectoId, subgerenteId, ...camposProyecto } = valores;

    const plantilla = await obtenerPlantillaActiva();
    if (!plantilla) throw new ErrorSinPlantillaActiva();

    const empresa = await obtenerConfiguracionEmpresa();

    const proyecto = await prisma.$transaction(
      async (tx) => {
        const creado = await tx.proyecto.create({
          data: { ...camposProyecto, plantillaOrigenId: plantilla.id },
        });

        // El equipo se guarda como asignaciones, no como columnas del proyecto:
        // así se puede cambiar sin perder el historial y se habilita el futuro
        // rol de cliente lector sin modificar el esquema.
        const asignaciones: { usuarioId: string; rol: RolProyecto }[] = [];
        if (itoId) asignaciones.push({ usuarioId: itoId, rol: "ITO" });
        if (jefeProyectoId) asignaciones.push({ usuarioId: jefeProyectoId, rol: "JEFE_PROYECTO" });
        if (subgerenteId) asignaciones.push({ usuarioId: subgerenteId, rol: "SUBGERENTE" });

        // Quien crea el proyecto queda con acceso aunque no se haya asignado a sí mismo.
        if (!asignaciones.some((a) => a.usuarioId === usuario.id) && usuario.rolGlobal !== "ADMIN") {
          asignaciones.push({ usuarioId: usuario.id, rol: "OBSERVADOR" });
        }

        if (asignaciones.length > 0) {
          await tx.asignacionProyecto.createMany({
            data: asignaciones.map((a) => ({
              proyectoId: creado.id,
              usuarioId: a.usuarioId,
              rol: a.rol,
              asignadoPorId: usuario.id,
            })),
            skipDuplicates: true,
          });
        }

        await clonarPlantillaEnProyecto(
          {
            proyectoId: creado.id,
            plantillaId: plantilla.id,
            prefijoDocumentos: empresa.prefijoDocumentos,
            formatoCodigoRegistro: empresa.formatoCodigoRegistro,
            fechaInicioProyecto: creado.fechaInicio,
            fechaTerminoProyecto: creado.fechaTerminoEstimada,
          },
          tx,
        );

        // La guía de planificación nace con el proyecto: la matriz de
        // responsabilidades se clona de la misma versión de la plantilla que el
        // checklist, y los servicios quedan listos para marcarse.
        await clonarPlanificacionEnProyecto(tx, {
          proyectoId: creado.id,
          plantillaId: plantilla.id,
        });

        await recalcularCumplimientoProyecto(creado.id, tx);

        return creado;
      },
      { timeout: 30_000 },
    );

    await registrarAuditoria({
      entidad: "Proyecto",
      entidadId: proyecto.id,
      accion: "CREAR",
      usuarioId: usuario.id,
      proyectoId: proyecto.id,
      valorNuevo: { codigo: proyecto.codigo, nombre: proyecto.nombre },
    });

    revalidatePath("/proyectos");
    revalidatePath("/panel");
    return {
      ok: true,
      proyectoId: proyecto.id,
      mensaje: `Proyecto "${proyecto.nombre}" creado con su checklist de calidad.`,
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarProyecto(
  proyectoId: string,
  _previo: ResultadoProyecto,
  datos: FormData,
): Promise<ResultadoProyecto> {
  try {
    const usuario = await exigirSesion();
    const contexto = await contextoProyecto(usuario, proyectoId);
    if (!contexto) return { error: "El proyecto no existe." };
    exigir(usuario, "proyecto.editar", contexto);

    const valores = esquemaProyecto.parse(aObjeto(datos));
    const { itoId, jefeProyectoId, subgerenteId, ...camposProyecto } = valores;

    const anterior = await prisma.proyecto.findUniqueOrThrow({ where: { id: proyectoId } });

    await prisma.$transaction(async (tx) => {
      await tx.proyecto.update({ where: { id: proyectoId }, data: camposProyecto });

      if (puedeAsignarEquipo(usuario.rolGlobal, contexto.rolesEnProyecto)) {
        await sincronizarAsignacion(tx, proyectoId, "ITO", itoId, usuario.id);
        await sincronizarAsignacion(tx, proyectoId, "JEFE_PROYECTO", jefeProyectoId, usuario.id);
        await sincronizarAsignacion(tx, proyectoId, "SUBGERENTE", subgerenteId, usuario.id);
      }
    });

    const cambios = camposModificados(
      anterior as unknown as Record<string, unknown>,
      camposProyecto as unknown as Record<string, unknown>,
    );
    await registrarAuditoria({
      entidad: "Proyecto",
      entidadId: proyectoId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      proyectoId,
      valorAnterior: cambios.anterior,
      valorNuevo: cambios.nuevo,
    });

    revalidatePath("/proyectos");
    revalidatePath(`/proyectos/${proyectoId}`);
    revalidatePath("/panel");
    return { ok: true, proyectoId, mensaje: "Proyecto actualizado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

function puedeAsignarEquipo(rolGlobal: string, rolesEnProyecto: RolProyecto[]): boolean {
  return (
    rolGlobal === "ADMIN" || rolGlobal === "SUBGERENTE" || rolesEnProyecto.includes("SUBGERENTE")
  );
}

/**
 * Deja exactamente un usuario activo con ese rol en el proyecto.
 * Las asignaciones anteriores se cierran (`hasta`), nunca se borran: el historial
 * de quién estuvo a cargo y cuándo es parte de la trazabilidad del proyecto.
 */
async function sincronizarAsignacion(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  proyectoId: string,
  rol: RolProyecto,
  usuarioId: string | undefined,
  asignadoPorId: string,
) {
  const actuales = await tx.asignacionProyecto.findMany({
    where: { proyectoId, rol, activo: true },
  });

  for (const asignacion of actuales) {
    if (asignacion.usuarioId === usuarioId) return; // sin cambios
    await tx.asignacionProyecto.update({
      where: { id: asignacion.id },
      data: { activo: false, hasta: new Date() },
    });
  }

  if (!usuarioId) return;

  await tx.asignacionProyecto.upsert({
    where: { proyectoId_usuarioId_rol: { proyectoId, usuarioId, rol } },
    update: { activo: true, hasta: null, desde: new Date(), asignadoPorId },
    create: { proyectoId, usuarioId, rol, asignadoPorId },
  });
}
