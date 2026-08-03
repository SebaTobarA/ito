"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaEmpresa } from "@/lib/validaciones";
import { ID_CONFIGURACION } from "@/server/datos/empresa";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

/** Guarda la configuración de marca y los parámetros de negocio de la empresa. */
export async function guardarConfiguracionEmpresa(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "empresa.configurar");

    const valores = esquemaEmpresa.parse(aObjeto(datos));

    const anterior = await prisma.configuracionEmpresa.findUnique({
      where: { id: ID_CONFIGURACION },
    });

    await prisma.configuracionEmpresa.upsert({
      where: { id: ID_CONFIGURACION },
      update: { ...valores, actualizadoPorId: usuario.id },
      create: { id: ID_CONFIGURACION, ...valores, actualizadoPorId: usuario.id },
    });

    await registrarAuditoria({
      entidad: "ConfiguracionEmpresa",
      entidadId: ID_CONFIGURACION,
      accion: anterior ? "ACTUALIZAR" : "CREAR",
      usuarioId: usuario.id,
      valorAnterior: anterior ? { nombreEmpresa: anterior.nombreEmpresa } : undefined,
      valorNuevo: { nombreEmpresa: valores.nombreEmpresa },
    });

    revalidatePath("/", "layout");
    return { ok: true, mensaje: "Configuración guardada." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
